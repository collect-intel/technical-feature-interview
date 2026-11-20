// Model Monoculture: known-answer test (briefs/model-monoculture.md).
// Identical responses must score 100; responses in random directions must score about 0.

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { canonicalJson, sha256 } from "../../lib/canonical.ts";
import { mulberry32 } from "../../lib/prng/mulberry32.ts";
import { now } from "../../server/db.ts";
import { runAnalysis, startMock, tempDb, testScenario } from "../helpers/env.ts";

const DIM = 256;
const rand = mulberry32(99);
const unit = (v: number[]) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const shared = unit(Array.from({ length: DIM }, () => rand() * 2 - 1));

type Row = { cellId: string; condition: "A" | "B"; text: string; vector: number[] };
const rows: Row[] = [
  ...Array.from({ length: 5 }, (_, i) => ({ cellId: `a_${i}`, condition: "A" as const, text: `Answer A${i}: the same idea, worded ${i} ways.`, vector: shared })),
  ...Array.from({ length: 200 }, (_, i) => ({
    cellId: `b_${i}`,
    condition: "B" as const,
    text: `Answer B${i}: an unrelated idea.`,
    vector: unit(Array.from({ length: DIM }, () => rand() * 2 - 1)),
  })),
];

let mock: Awaited<ReturnType<typeof startMock>>;
before(async () => {
  const embeddings = Object.fromEntries(rows.map((r) => [sha256(r.text), r.vector]));
  mock = await startMock(testScenario({ embeddings, embeddingDim: DIM }));
});
after(() => mock.close());

test("diversity: identical responses score 100, random ones about 0", async () => {
  const { path, db } = tempDb();
  const runId = "run_known_answer_diversity";
  const targets = [
    { id: "tA", provider: "sim", model: "sim/a", temperature: 0, systemPromptIndex: 0, condition: "A" },
    { id: "tB", provider: "sim", model: "sim/b", temperature: 0, systemPromptIndex: 0, condition: "B" },
  ];
  const manifest = { scenarioId: "known-answer", targets, judges: [] };
  db.prepare(
    "INSERT INTO runs (id, scenario_id, blueprint_hash, manifest_json, manifest_hash, status, created_at, finished_at) VALUES (?, 'known-answer', 'x', ?, ?, 'complete', ?, ?)",
  ).run(runId, canonicalJson(manifest), sha256(canonicalJson(manifest)), now(), now());
  db.exec("BEGIN");
  for (const r of rows) {
    db.prepare("INSERT INTO cells (id, run_id, target_id, item_id, repeat, status) VALUES (?, ?, ?, ?, 0, 'done')").run(
      r.cellId, runId, r.condition === "A" ? "tA" : "tB", r.cellId,
    );
    db.prepare("INSERT INTO responses (cell_id, text, tokens_in, tokens_out) VALUES (?, ?, 10, 20)").run(r.cellId, r.text);
  }
  db.exec("COMMIT");
  db.close();

  const row = await runAnalysis("diversity", runId, { DB_PATH: path, MOCK_URL: mock.url });
  const result = JSON.parse(row.result_json) as { scores: { cell_id: string; condition: string; score: number }[] };
  assert.ok(Array.isArray(result.scores), "result_json.scores must be an array");
  const byCell = new Map(result.scores.map((s) => [s.cell_id, s]));
  for (const r of rows) assert.ok(byCell.has(r.cellId), `no score for ${r.cellId}`);
  for (const r of rows.filter((r) => r.condition === "A")) {
    assert.ok(Math.abs(byCell.get(r.cellId)!.score - 100) < 0.01, `identical responses should score 100, got ${byCell.get(r.cellId)!.score}`);
  }
  const b = rows.filter((r) => r.condition === "B").map((r) => byCell.get(r.cellId)!.score);
  const mean = b.reduce((a, x) => a + x, 0) / b.length;
  assert.ok(Math.abs(mean) < 5, `random responses should average about 0, got ${mean.toFixed(2)}`);
});
