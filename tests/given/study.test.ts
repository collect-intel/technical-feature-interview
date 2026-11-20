import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { surveyKey } from "../../lib/scenario.ts";
import { loadStudy } from "../../server/study.ts";
import { syntheticStudy } from "../../lib/study.ts";
import { startMock, tempDb, testScenario } from "../helpers/env.ts";

const study = syntheticStudy({ id: "s1", seed: 3, participants: 5, items: 4, retest: 0.8, conditions: { interview: 0.7 } });
let mock: Awaited<ReturnType<typeof startMock>>;
before(async () => (mock = await startMock(testScenario({ study }))));
after(() => mock.close());

test("a study loads once: participants, items and both waves of answers", () => {
  const { db } = tempDb();
  const scenario = testScenario({ study });
  assert.equal(loadStudy(db, scenario), "s1");
  assert.equal(loadStudy(db, scenario), "s1");
  const n = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  assert.equal(n("SELECT COUNT(*) AS n FROM studies"), 1);
  assert.equal(n("SELECT COUNT(*) AS n FROM study_participants"), 5);
  assert.equal(n("SELECT COUNT(*) AS n FROM study_items"), 4);
  assert.equal(n("SELECT COUNT(*) AS n FROM study_answers"), 5 * 4 * 2);
});

test("agents' answers come from the gateway", async () => {
  const res = await fetch(`${mock.url}/v1/survey`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ condition: "interview", participantId: "p0001", itemId: "q001" }),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).answer, study.agentAnswers[surveyKey("interview", "p0001", "q001")]);
});
