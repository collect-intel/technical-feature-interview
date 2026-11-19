// The run pipeline, modelled on Weval Studio's plan → cell → finish (TDD §4.4).
//   plan:   freeze a manifest and one cell per (target × item × repeat), with deterministic ids
//   cell:   generate (skipped if already stored), then grade with point functions and judges
//   finish: mark the run complete, or partial if anything failed
// Jobs live in SQLite with a lease. A crash leaves leases that expire and are reclaimed;
// stored responses and verdicts are never requested again.

import { canonicalJson, sha256, stableId } from "../lib/canonical.ts";
import { pointFunctions } from "../lib/pointFunctions/index.ts";
import type { Scenario } from "../lib/scenario.ts";
import { now, type DB } from "./db.ts";
import { call, CallFailed, DEFAULT_RETRY, type RetryPolicy } from "./gateway.ts";

export const JUDGE_PROMPT_VERSION = "judge@1";

export type Manifest = {
  scenarioId: string;
  blueprintHash: string;
  targets: Scenario["targets"];
  judges: Scenario["judges"];
  repeats: number;
  promptVersions: { judge: string; systemPrompts: string[] };
  retry: RetryPolicy;
};

export function launchRun(db: DB, scenario: Scenario, retry: RetryPolicy = DEFAULT_RETRY): string {
  const blueprintHash = sha256(canonicalJson(scenario.blueprint));
  const manifest: Manifest = {
    scenarioId: scenario.id,
    blueprintHash,
    targets: scenario.targets,
    judges: scenario.judges,
    repeats: scenario.repeats,
    promptVersions: {
      judge: JUDGE_PROMPT_VERSION,
      systemPrompts: scenario.blueprint.systemPrompts.map((p) => sha256(String(p)).slice(0, 12)),
    },
    retry,
  };
  const manifestJson = canonicalJson(manifest);
  const manifestHash = sha256(manifestJson);
  const n = (db.prepare("SELECT COUNT(*) AS n FROM runs").get() as { n: number }).n;
  const runId = `run_${stableId(scenario.id, manifestHash, n)}`;

  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO runs (id, scenario_id, blueprint_hash, manifest_json, manifest_hash, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'running', ?)`,
    ).run(runId, scenario.id, blueprintHash, manifestJson, manifestHash, now());
    const cell = db.prepare(
      "INSERT INTO cells (id, run_id, target_id, item_id, repeat, status) VALUES (?, ?, ?, ?, ?, 'pending')",
    );
    const job = db.prepare(
      "INSERT INTO jobs (id, kind, payload_json, status, created_at) VALUES (?, ?, ?, 'queued', ?)",
    );
    for (const t of scenario.targets) {
      for (const item of scenario.blueprint.items) {
        for (let r = 0; r < scenario.repeats; r++) {
          const cellId = stableId(runId, t.id, item.id, r);
          cell.run(cellId, runId, t.id, item.id, r);
          job.run(`cell:${cellId}`, "cell", JSON.stringify({ runId, cellId }), now());
        }
      }
    }
    job.run(`finish:${runId}`, "finish", JSON.stringify({ runId }), now());
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return runId;
}

type Job = { id: string; kind: string; payload_json: string; attempts: number };

export type Worker = { stop: () => Promise<void>; idle: () => Promise<void> };

export function startWorker(
  db: DB,
  scenario: Scenario,
  opts: { concurrency?: number; leaseMs?: number; pollMs?: number } = {},
): Worker {
  const concurrency = opts.concurrency ?? 4;
  const leaseMs = opts.leaseMs ?? 60_000;
  const pollMs = opts.pollMs ?? 250;
  let running = true;
  let active = 0;
  const loops: Promise<void>[] = [];

  const claim = db.prepare(
    `UPDATE jobs SET status = 'leased', lease_until = ?, attempts = attempts + 1
     WHERE id = (
       SELECT id FROM jobs
       WHERE status = 'queued' OR (status = 'leased' AND lease_until < ?)
       ORDER BY kind = 'finish', created_at, id
       LIMIT 1)
     RETURNING id, kind, payload_json, attempts`,
  );

  async function loop() {
    while (running) {
      const job = claim.get(Date.now() + leaseMs, Date.now()) as Job | undefined;
      if (!job) {
        await sleep(pollMs);
        continue;
      }
      active++;
      const heartbeat = setInterval(
        () => db.prepare("UPDATE jobs SET lease_until = ? WHERE id = ?").run(Date.now() + leaseMs, job.id),
        Math.max(50, leaseMs / 3),
      );
      try {
        const done = await runJob(db, scenario, job);
        if (done) db.prepare("UPDATE jobs SET status = 'done', lease_until = NULL WHERE id = ?").run(job.id);
        else {
          db.prepare("UPDATE jobs SET status = 'queued', lease_until = NULL WHERE id = ?").run(job.id);
          await sleep(pollMs); // not ready yet (e.g. finish waiting on cells): don't spin
        }
      } catch (e) {
        const status = job.attempts >= 5 ? "failed" : "queued";
        db.prepare("UPDATE jobs SET status = ?, lease_until = NULL, last_error = ? WHERE id = ?").run(
          status,
          (e as Error).message,
          job.id,
        );
        if (status === "failed" && job.kind === "cell") {
          // A cell whose job keeps crashing is a failed cell, so its run can still finish (as partial).
          const { cellId } = JSON.parse(job.payload_json);
          db.prepare("UPDATE cells SET status = 'failed', error_class = 'internal' WHERE id = ? AND status = 'pending'").run(cellId);
        }
      } finally {
        clearInterval(heartbeat);
        active--;
      }
    }
  }

  for (let i = 0; i < concurrency; i++) loops.push(loop());

  return {
    stop: async () => {
      running = false;
      await Promise.all(loops);
    },
    idle: async () => {
      for (;;) {
        const open = db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE status IN ('queued', 'leased')").get() as { n: number };
        if (open.n === 0 && active === 0) return;
        await sleep(pollMs);
      }
    },
  };
}

/** Returns true when the job is finished, false to requeue it. */
async function runJob(db: DB, scenario: Scenario, job: Job): Promise<boolean> {
  const payload = JSON.parse(job.payload_json);
  if (job.kind === "cell") return runCell(db, scenario, payload.runId, payload.cellId);
  if (job.kind === "finish") return finishRun(db, payload.runId);
  throw new Error(`unknown job kind ${job.kind}`);
}

async function runCell(db: DB, scenario: Scenario, runId: string, cellId: string): Promise<boolean> {
  const cell = db.prepare("SELECT * FROM cells WHERE id = ?").get(cellId) as any;
  if (!cell || cell.status !== "pending") return true;
  const manifest = JSON.parse(
    (db.prepare("SELECT manifest_json FROM runs WHERE id = ?").get(runId) as any).manifest_json,
  ) as Manifest;
  const target = manifest.targets.find((t) => t.id === cell.target_id)!;
  const item = scenario.blueprint.items.find((i) => i.id === cell.item_id)!;
  db.prepare("UPDATE cells SET attempts = attempts + 1 WHERE id = ?").run(cellId);

  // 1. Generate, unless a previous attempt already stored the response.
  let response = db.prepare("SELECT text FROM responses WHERE cell_id = ?").get(cellId) as { text: string } | undefined;
  if (!response) {
    try {
      const out = await call<{ text: string; usage: { input: number; output: number } }>(
        db,
        scenario,
        "/v1/chat",
        { targetId: target.id, itemId: item.id, repeat: cell.repeat, prompt: item.prompt },
        {
          runId,
          kind: "chat",
          model: target.model,
          promptVersion: manifest.promptVersions.systemPrompts[target.systemPromptIndex] ?? null,
        },
        manifest.retry,
      );
      db.prepare("INSERT INTO responses (cell_id, text, tokens_in, tokens_out) VALUES (?, ?, ?, ?)").run(
        cellId,
        out.text,
        out.usage?.input ?? 0,
        out.usage?.output ?? 0,
      );
      response = { text: out.text };
    } catch (e) {
      const errorClass = e instanceof CallFailed ? e.errorClass : "unknown";
      db.prepare("UPDATE cells SET status = 'failed', error_class = ? WHERE id = ?").run(errorClass, cellId);
      return true;
    }
  }

  // 2. Grade. Each verdict is stored as soon as it arrives, so a resumed cell asks only for what's missing.
  const have = db.prepare("SELECT 1 FROM verdicts WHERE cell_id = ? AND criterion_id = ? AND judge_id = ?");
  const put = db.prepare(
    "INSERT INTO verdicts (cell_id, criterion_id, judge_id, verdict, score, raw) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const c of item.criteria) {
    if (c.kind === "fn") {
      if (have.get(cellId, c.id, "fn")) continue;
      const fn = pointFunctions[c.fn];
      const out = fn ? await fn(response.text, c.arg, { modelId: target.model }) : { error: `unknown function ${c.fn}` };
      const { score, error } = pointScore(out);
      put.run(cellId, c.id, "fn", score === null ? null : score >= 0.5 ? "met" : "unmet", score, error);
      continue;
    }
    for (const judge of manifest.judges) {
      if (have.get(cellId, c.id, judge.id)) continue;
      try {
        const v = await call<{ verdict: "met" | "unmet"; score: number; raw: string | null }>(
          db,
          scenario,
          "/v1/judge",
          { judgeId: judge.id, targetId: target.id, itemId: item.id, repeat: cell.repeat, criterionId: c.id, response: response.text },
          { runId, kind: "judge", model: judge.model, promptVersion: manifest.promptVersions.judge },
          manifest.retry,
        );
        put.run(cellId, c.id, judge.id, v.verdict, v.score, v.raw);
      } catch (e) {
        // A failed judge is recorded as missing (null), never as a zero.
        put.run(cellId, c.id, judge.id, null, null, `failed: ${(e as Error).message}`);
      }
    }
  }
  db.prepare("UPDATE cells SET status = 'done' WHERE id = ?").run(cellId);
  return true;
}

/** A point function's result as a score in [0, 1], or null with the reason it couldn't score. */
function pointScore(out: unknown): { score: number | null; error: string | null } {
  if (typeof out === "boolean") return { score: Number(out), error: null };
  if (typeof out === "number") return { score: out, error: null };
  if (out && typeof out === "object") {
    if ("error" in out) return { score: null, error: String((out as { error: unknown }).error) };
    if ("score" in out) return { score: Number((out as { score: unknown }).score), error: null };
  }
  return { score: null, error: "point function returned nothing usable" };
}

function finishRun(db: DB, runId: string): boolean {
  const pending = db.prepare("SELECT COUNT(*) AS n FROM cells WHERE run_id = ? AND status = 'pending'").get(runId) as { n: number };
  if (pending.n > 0) return false;
  const failed = db.prepare("SELECT COUNT(*) AS n FROM cells WHERE run_id = ? AND status = 'failed'").get(runId) as { n: number };
  const missing = db
    .prepare("SELECT COUNT(*) AS n FROM verdicts v JOIN cells c ON c.id = v.cell_id WHERE c.run_id = ? AND v.verdict IS NULL")
    .get(runId) as { n: number };
  const status = failed.n + missing.n > 0 ? "partial" : "complete";
  db.prepare("UPDATE runs SET status = ?, finished_at = ? WHERE id = ?").run(status, now(), runId);
  return true;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
