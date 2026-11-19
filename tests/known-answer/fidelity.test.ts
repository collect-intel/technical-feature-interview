// Agent Fidelity: known-answer test (briefs/agent-fidelity.md).
// Normalized accuracy = an agent's accuracy against a person's first answers, divided by how well
// the person matched their own first answers two weeks later. An agent that gives exactly the
// person's second-wave answers must score 1.0; one that gives their first-wave answers must be
// 100% accurate.

import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { surveyKey } from "../../lib/scenario.ts";
import { loadStudy } from "../../server/study.ts";
import { syntheticStudy } from "../../scripts/lib/study.ts";
import { runAnalysis, startMock, tempDb, testScenario } from "../helpers/env.ts";

const study = syntheticStudy({ id: "study_known_answer", seed: 11, participants: 30, items: 20, retest: 0.8, conditions: { retest: 0, first: 0 } });
for (const p of study.participants) {
  for (const item of study.items) {
    study.agentAnswers[surveyKey("retest", p.id, item.id)] = study.answers.wave2[`${p.id}|${item.id}`];
    study.agentAnswers[surveyKey("first", p.id, item.id)] = study.answers.wave1[`${p.id}|${item.id}`];
  }
}
const scenario = testScenario({ study });

let mock: Awaited<ReturnType<typeof startMock>>;
before(async () => (mock = await startMock(scenario)));
after(() => mock.close());

test("fidelity: an agent that answers like the person's retest scores 1.0", async () => {
  const { path, db } = tempDb();
  loadStudy(db, scenario);
  db.close();
  const row = await runAnalysis("fidelity", study.id, { DB_PATH: path, MOCK_URL: mock.url });
  type P = { participant_id: string; accuracy: number; consistency: number; normalized_accuracy: number | null };
  const result = JSON.parse(row.result_json) as { conditions: Record<string, { participants: P[] }> };
  for (const condition of ["retest", "first"]) {
    const ps = result.conditions?.[condition]?.participants;
    assert.ok(Array.isArray(ps), `result_json.conditions.${condition}.participants must be an array`);
    assert.equal(ps.length, study.participants.length, `one entry per participant for ${condition}`);
  }
  for (const p of result.conditions.retest.participants) {
    assert.ok(Math.abs(p.accuracy - p.consistency) < 1e-9, `${p.participant_id}: agent accuracy should equal the person's retest consistency`);
    assert.ok(p.normalized_accuracy !== null && Math.abs(p.normalized_accuracy - 1) < 1e-9, `${p.participant_id}: normalized accuracy should be 1, got ${p.normalized_accuracy}`);
  }
  for (const p of result.conditions.first.participants) {
    assert.ok(Math.abs(p.accuracy - 1) < 1e-9, `${p.participant_id}: an agent repeating the first answers is 100% accurate, got ${p.accuracy}`);
  }
});
