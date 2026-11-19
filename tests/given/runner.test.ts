import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { chatKey, judgeKey, type Scenario } from "../../lib/scenario.ts";
import type { DB } from "../../server/db.ts";
import { startMock, tempDb, testScenario } from "../helpers/env.ts";

import * as runner from "../../server/runner.ts";

const fastRetry = { maxAttempts: 3, baseDelayMs: 5, timeoutMs: 2_000 };

const scenario: Scenario = testScenario({
  failures: [
    // recovers on retry
    { endpoint: "chat", key: chatKey("t-alpha-small", "water-cycle", 0), attempt: 1, kind: "429" },
    { endpoint: "judge", key: judgeKey("j1", "t-beta-mid", "recipe-swap", 0, "explains-why"), attempt: 1, kind: "malformed" },
    // never recovers: a failed cell and a missing verdict
    ...[1, 2, 3].map((attempt) => ({ endpoint: "chat" as const, key: chatKey("t-beta-mid", "library-hours", 0), attempt, kind: "500" as const })),
    ...[1, 2, 3].map((attempt) => ({ endpoint: "judge" as const, key: judgeKey("j2", "t-alpha-large", "water-cycle", 0, "accurate"), attempt, kind: "500" as const })),
  ],
});

// Each test gets a fresh mock, so its scheduled failures start from attempt 1.
let mock: Awaited<ReturnType<typeof startMock>> | null = null;
beforeEach(async () => {
  mock = await startMock(scenario);
  process.env.MOCK_URL = mock.url;
});
afterEach(() => mock?.close());

async function runToEnd(db: DB, runId?: string) {
  const id = runId ?? runner.launchRun(db, scenario, fastRetry);
  const w = runner.startWorker(db, scenario, { concurrency: 3, leaseMs: 500, pollMs: 20 });
  await w.idle();
  await w.stop();
  return id;
}

const count = (db: DB, sql: string, ...args: unknown[]) => (db.prepare(sql).get(...(args as [])) as { n: number }).n;

test("a run with failures finishes as partial, recording failures rather than zeros", async () => {
  const { db } = tempDb();
  const runId = await runToEnd(db);
  const run = db.prepare("SELECT status FROM runs WHERE id = ?").get(runId) as { status: string };
  assert.equal(run.status, "partial");
  const failed = db.prepare("SELECT target_id, item_id, error_class FROM cells WHERE status = 'failed'").all() as any[];
  assert.deepEqual(failed.map((c) => [c.target_id, c.item_id, c.error_class]), [["t-beta-mid", "library-hours", "server_error"]]);
  const missing = db.prepare("SELECT judge_id, criterion_id FROM verdicts WHERE verdict IS NULL").all() as any[];
  assert.deepEqual(missing.map((v) => [v.judge_id, v.criterion_id]), [["j2", "accurate"]]);
  assert.equal(count(db, "SELECT COUNT(*) AS n FROM verdicts WHERE score = 0 AND verdict IS NULL"), 0);
});

test("every attempt is logged with model, prompt version, latency and cost", async () => {
  const { db } = tempDb();
  await runToEnd(db);
  assert.ok(count(db, "SELECT COUNT(*) AS n FROM call_log WHERE status = 'http_429'") >= 1);
  assert.ok(count(db, "SELECT COUNT(*) AS n FROM call_log WHERE status = 'malformed'") >= 1);
  assert.equal(count(db, "SELECT COUNT(*) AS n FROM call_log WHERE model IS NULL OR prompt_version IS NULL"), 0);
  assert.equal(count(db, "SELECT COUNT(*) AS n FROM call_log WHERE status = 'ok' AND cost_usd IS NULL"), 0);
});

test("after a crash, expired leases are reclaimed and stored work isn't requested again", async () => {
  const { db } = tempDb();
  const runId = await runToEnd(db);
  // Simulate a crash mid-cell: one finished cell back to pending, its job stuck under an expired lease.
  const cell = db.prepare("SELECT id FROM cells WHERE run_id = ? AND status = 'done' LIMIT 1").get(runId) as { id: string };
  db.prepare("UPDATE cells SET status = 'pending' WHERE id = ?").run(cell.id);
  db.prepare("DELETE FROM verdicts WHERE cell_id = ? AND judge_id = 'j3'").run(cell.id);
  db.prepare("UPDATE jobs SET status = 'leased', lease_until = ? WHERE id = ?").run(Date.now() - 1, `cell:${cell.id}`);
  db.prepare("UPDATE jobs SET status = 'queued' WHERE id = ?").run(`finish:${runId}`);
  const chatBefore = count(db, "SELECT COUNT(*) AS n FROM call_log WHERE kind = 'chat'");
  const judgeBefore = count(db, "SELECT COUNT(*) AS n FROM call_log WHERE kind = 'judge'");
  const j3Criteria = count(db, "SELECT COUNT(DISTINCT criterion_id) AS n FROM verdicts WHERE cell_id = ? AND judge_id = 'j1'", cell.id);

  await runToEnd(db, runId);

  assert.equal(count(db, "SELECT COUNT(*) AS n FROM cells WHERE id = ? AND status = 'done'", cell.id), 1);
  assert.equal(count(db, "SELECT COUNT(*) AS n FROM call_log WHERE kind = 'chat'"), chatBefore, "the stored response was re-requested");
  assert.equal(count(db, "SELECT COUNT(*) AS n FROM call_log WHERE kind = 'judge'"), judgeBefore + j3Criteria, "only the missing verdicts should be requested");
});
