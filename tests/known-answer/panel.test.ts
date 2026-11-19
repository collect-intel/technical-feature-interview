// Judge Panel Trust: known-answer test (briefs/judge-panel-trust.md).
// The paper's own simulation: 4 judges with accuracies 0.6, 0.7, 0.8, 0.9; K = 2; 10,000 questions.
// Under these conditions the paper's methods beat majority vote by a clear margin.

import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalJson, sha256 } from "../../lib/canonical.ts";
import { mulberry32 } from "../../lib/prng/mulberry32.ts";
import { now } from "../../server/db.ts";
import { runAnalysis, tempDb } from "../helpers/env.ts";

test("panel: on the paper's simulation, ISP and Optimal Weight beat majority vote", async () => {
  const { path, db } = tempDb();
  const rand = mulberry32(2026);
  const accuracies = [0.6, 0.7, 0.8, 0.9];
  const judges = accuracies.map((_, i) => ({ id: `j${i + 1}`, provider: "sim", model: `sim/judge-${i + 1}` }));
  const runId = "run_known_answer_panel";
  const manifest = { scenarioId: "known-answer", judges, targets: [{ id: "t", provider: "sim", model: "sim/target", temperature: 0, systemPromptIndex: 0 }] };
  db.prepare(
    "INSERT INTO runs (id, scenario_id, blueprint_hash, manifest_json, manifest_hash, status, created_at, finished_at) VALUES (?, 'known-answer', 'x', ?, ?, 'complete', ?, ?)",
  ).run(runId, canonicalJson(manifest), sha256(canonicalJson(manifest)), now(), now());

  const truth = new Map<string, "met" | "unmet">();
  const cell = db.prepare("INSERT INTO cells (id, run_id, target_id, item_id, repeat, status) VALUES (?, ?, 't', ?, 0, 'done')");
  const verdict = db.prepare("INSERT INTO verdicts (cell_id, criterion_id, judge_id, verdict, score) VALUES (?, 'c', ?, ?, ?)");
  db.exec("BEGIN");
  for (let q = 0; q < 10_000; q++) {
    const cellId = `cell_${q}`;
    const t = rand() < 0.5 ? "met" : "unmet";
    truth.set(`${cellId}|c`, t);
    cell.run(cellId, runId, `item_${q}`);
    accuracies.forEach((acc, i) => {
      const v = rand() < acc ? t : t === "met" ? "unmet" : "met";
      verdict.run(cellId, judges[i].id, v, v === "met" ? 1 : 0);
    });
  }
  db.exec("COMMIT");
  db.close();

  const row = await runAnalysis("panel", runId, { DB_PATH: path });
  const result = JSON.parse(row.result_json) as { methods: Record<string, { labels: Record<string, "met" | "unmet"> }> };
  const accuracy = (method: string) => {
    const labels = result.methods?.[method]?.labels;
    assert.ok(labels, `result_json.methods.${method}.labels is missing`);
    let right = 0;
    for (const [key, t] of truth) {
      assert.ok(labels[key], `no ${method} label for ${key}`);
      if (labels[key] === t) right++;
    }
    return right / truth.size;
  };
  const mv = accuracy("majority");
  const isp = accuracy("isp");
  const ow = accuracy("ow");
  assert.ok(mv > 0.82 && mv < 0.88, `majority vote accuracy ${mv.toFixed(3)} is outside what this simulation gives (about 0.85)`);
  assert.ok(isp >= mv + 0.03, `ISP ${isp.toFixed(3)} should beat majority vote ${mv.toFixed(3)} by at least 3 points`);
  assert.ok(ow >= mv + 0.03, `Optimal Weight ${ow.toFixed(3)} should beat majority vote ${mv.toFixed(3)} by at least 3 points`);
  assert.equal(row.status, "final");
});
