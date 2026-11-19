import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chatKey } from "../../lib/scenario.ts";
import { startMock, testScenario } from "../helpers/env.ts";

const failingKey = chatKey("t-alpha-small", "water-cycle", 0);
let mock: Awaited<ReturnType<typeof startMock>>;

before(async () => {
  mock = await startMock(
    testScenario({
      failures: [{ endpoint: "chat", key: failingKey, attempt: 1, kind: "500" }],
      rateLimits: { beta: { capacity: 2, refillPerSec: 0.5 } },
    }),
  );
});
after(() => mock.close());

const post = (path: string, body: unknown) =>
  fetch(`${mock.url}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("a scheduled failure happens on its attempt, then the call succeeds", async () => {
  const body = { targetId: "t-alpha-small", itemId: "water-cycle", repeat: 0 };
  assert.equal((await post("/v1/chat", body)).status, 500);
  const ok = await post("/v1/chat", body);
  assert.equal(ok.status, 200);
  assert.match((await ok.json()).text, /evaporates/);
});

test("responses are replayed exactly", async () => {
  const body = { targetId: "t-alpha-large", itemId: "recipe-swap", repeat: 0 };
  const a = await (await post("/v1/chat", body)).json();
  const b = await (await post("/v1/chat", body)).json();
  assert.deepEqual(a, b);
});

test("a provider's rate limit returns 429 with Retry-After", async () => {
  const body = { targetId: "t-beta-mid", itemId: "water-cycle", repeat: 0 };
  const statuses = [];
  for (let i = 0; i < 3; i++) statuses.push((await post("/v1/chat", body)).status);
  assert.deepEqual(statuses, [200, 200, 429]);
  const limited = await post("/v1/chat", body);
  assert.ok(Number(limited.headers.get("retry-after")) >= 1);
});

test("unknown keys are a 404, not a made-up answer", async () => {
  assert.equal((await post("/v1/chat", { targetId: "t-alpha-small", itemId: "nope", repeat: 0 })).status, 404);
});

test("embeddings: unlisted content gets a stable unit vector", async () => {
  const a = await (await post("/v1/embed", { input: ["hello"] })).json();
  const b = await (await post("/v1/embed", { input: ["hello"] })).json();
  const v: number[] = a.data[0].embedding;
  assert.deepEqual(a, b);
  assert.ok(Math.abs(Math.hypot(...v) - 1) < 1e-9);
});

test("agents answer deterministically from the options they're shown", async () => {
  const body = { simId: "s", step: 3, agent: 1, options: ["A", "B"], memory: [] };
  const a = await (await post("/v1/agent", body)).json();
  const b = await (await post("/v1/agent", body)).json();
  assert.ok(["A", "B"].includes(a.choice));
  assert.equal(a.choice, b.choice);
});
