// Convention Lab: known-answer test (briefs/convention-lab.md).
// With two names and agents that have no preference of any kind, populations should reach a
// shared convention, and across seeds neither name should dominate.

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { runAnalysis, startMock, tempDb, testScenario } from "../helpers/env.ts";

let mock: Awaited<ReturnType<typeof startMock>>;
before(async () => {
  mock = await startMock(testScenario({ agentModel: { listOrderWeight: [0, 0], namePrior: {}, memoryWeight: 2, temperature: 1 } }));
});
after(() => mock.close());

test("lab: unbiased agents converge, and neither name wins more than chance allows", async () => {
  const { path } = tempDb();
  const params = { names: ["A", "B"], population: 24, memory: 5, maxRounds: 30, seeds: 30, committedMinority: 0 };
  const row = await runAnalysis("lab", "batch_known_answer", { DB_PATH: path, MOCK_URL: mock.url, LAB_PARAMS: JSON.stringify(params) }, 300_000);
  const result = JSON.parse(row.result_json) as { runs: { seed: number; converged: boolean; convention: string | null }[] };
  assert.ok(Array.isArray(result.runs), "result_json.runs must be an array");
  assert.equal(result.runs.length, params.seeds, "one entry per seed");
  const converged = result.runs.filter((r) => r.converged);
  assert.ok(converged.length >= 0.8 * params.seeds, `only ${converged.length} of ${params.seeds} populations converged`);
  const shareA = converged.filter((r) => r.convention === "A").length / converged.length;
  assert.ok(shareA >= 0.2 && shareA <= 0.8, `with no bias, "A" won ${(shareA * 100).toFixed(0)}% of converged runs`);
});
