// The mock model gateway (TDD §4.3). It replays the loaded scenario and nothing else: every
// response, verdict, vector, failure, rate limit and agent parameter comes from scenario data.
// The Next.js app serves it at /mock/*; tests serve it on its own port (mock/server.ts).

import { sha256 } from "../lib/canonical.ts";
import { hashSeed } from "../lib/prng/hashSeed.ts";
import { mulberry32 } from "../lib/prng/mulberry32.ts";
import {
  agentKey,
  chatKey,
  fallbackEmbedding,
  judgeKey,
  latencyFor,
  surveyKey,
  type Failure,
  type Scenario,
} from "../lib/scenario.ts";

type Endpoint = Failure["endpoint"];

export type MockResponse = { status: number; body: string; headers: Record<string, string> };

class Bucket {
  private tokens: number;
  private last = Date.now();
  private capacity: number;
  private refillPerSec: number;
  constructor(capacity: number, refillPerSec: number) {
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.tokens = capacity;
  }
  /** 0 if a token was taken, otherwise seconds until one is available. */
  take(): number {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.refillPerSec);
    this.last = now;
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return 0;
    }
    return Math.ceil((1 - this.tokens) / this.refillPerSec);
  }
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}): MockResponse => ({
  status,
  body: JSON.stringify(body),
  headers: { "content-type": "application/json", ...headers },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A gateway for one scenario. Attempt counts and rate limits live in memory, so a restart resets them. */
export function createGateway(scenario: Scenario) {
  const attempts = new Map<string, number>();
  const stats: Record<string, number> = {};
  const buckets = new Map<string, Bucket>();
  const providerOf = new Map<string, string>();
  for (const t of scenario.targets) providerOf.set(t.id, t.provider);
  for (const j of scenario.judges) providerOf.set(j.id, j.provider);

  function bucket(provider: string): Bucket | null {
    const cfg = scenario.rateLimits[provider];
    if (!cfg) return null;
    if (!buckets.has(provider)) buckets.set(provider, new Bucket(cfg.capacity, cfg.refillPerSec));
    return buckets.get(provider)!;
  }

  async function replay(endpoint: Endpoint, key: string, provider: string, body: () => unknown): Promise<MockResponse> {
    const n = (attempts.get(`${endpoint}|${key}`) ?? 0) + 1;
    attempts.set(`${endpoint}|${key}`, n);
    stats[endpoint] = (stats[endpoint] ?? 0) + 1;

    const wait = bucket(provider)?.take() ?? 0;
    if (wait > 0) return json(429, { error: "rate_limited", provider }, { "retry-after": String(wait) });

    await sleep(latencyFor(scenario, `${endpoint}|${key}`, n));

    const failure = scenario.failures.find((f) => f.endpoint === endpoint && f.key === key && f.attempt === n);
    if (failure?.kind === "429") return json(429, { error: "rate_limited", provider }, { "retry-after": "1" });
    if (failure?.kind === "500") return json(500, { error: "upstream_error" });
    if (failure?.kind === "timeout") {
      await sleep(30_000);
      return json(504, { error: "gateway_timeout" });
    }
    if (failure?.kind === "malformed") {
      return { status: 200, body: '{"text": "The answer is', headers: { "content-type": "application/json" } };
    }
    try {
      return json(200, body());
    } catch (e) {
      return json(404, { error: (e as Error).message });
    }
  }

  return async function handle(method: string, path: string, rawBody: string): Promise<MockResponse> {
    if (method === "GET" && path === "/health") return json(200, { ok: true, scenario: scenario.id });
    if (method === "GET" && path === "/__stats") return json(200, { requests: stats });
    if (method !== "POST") return json(404, { error: "not found" });
    let b: Record<string, any>;
    try {
      b = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return json(400, { error: "body is not valid JSON" });
    }

    switch (path) {
      case "/v1/chat": {
        const key = chatKey(b.targetId, b.itemId, Number(b.repeat ?? 0));
        return replay("chat", key, providerOf.get(b.targetId) ?? "unknown", () => {
          const r = scenario.responses[key];
          if (!r) throw new Error(`no response for ${key}`);
          const target = scenario.targets.find((t) => t.id === b.targetId)!;
          return { id: `chat_${sha256(key).slice(0, 12)}`, model: target.model, text: r.text, usage: { input: r.tokensIn, output: r.tokensOut } };
        });
      }
      case "/v1/judge": {
        const key = judgeKey(b.judgeId, b.targetId, b.itemId, Number(b.repeat ?? 0), b.criterionId);
        return replay("judge", key, providerOf.get(b.judgeId) ?? "unknown", () => {
          const v = scenario.verdicts[key];
          if (!v) throw new Error(`no verdict for ${key}`);
          const judge = scenario.judges.find((j) => j.id === b.judgeId)!;
          return { model: judge.model, verdict: v.verdict, score: v.score, raw: v.raw ?? null, usage: { input: 400, output: 60 } };
        });
      }
      case "/v1/embed": {
        const inputs: string[] = Array.isArray(b.input) ? b.input : [b.input];
        const key = sha256(inputs.join("\u0000"));
        return replay("embed", key, "embed", () => ({
          data: inputs.map((text) => {
            const h = sha256(text);
            return { contentHash: h, embedding: scenario.embeddings[h] ?? fallbackEmbedding(h, scenario.embeddingDim) };
          }),
        }));
      }
      case "/v1/survey": {
        const key = surveyKey(b.condition, b.participantId, b.itemId);
        return replay("survey", key, `survey:${b.condition}`, () => {
          if (!scenario.study) throw new Error("this scenario has no study");
          if (!(key in scenario.study.agentAnswers)) throw new Error(`no agent answer for ${key}`);
          return { answer: scenario.study.agentAnswers[key], usage: { input: 900, output: 8 } };
        });
      }
      case "/v1/agent": {
        const key = agentKey(b.simId, Number(b.step), Number(b.agent));
        return replay("agent", key, "agent", () => ({ choice: chooseName(scenario, key, b.options, b.memory ?? []) }));
      }
      default:
        return json(404, { error: "not found" });
    }
  };
}

/** A generic agent: softmax over options, from list position, name and remembered successes. */
function chooseName(s: Scenario, key: string, options: string[], memory: { name: string; success: boolean }[]): string {
  if (!s.agentModel) throw new Error("this scenario has no agent model");
  if (!Array.isArray(options) || options.length === 0) throw new Error("options must be a non-empty array");
  const m = s.agentModel;
  const logits = options.map((name, i) => {
    const wins = memory.filter((x) => x.name === name && x.success).length;
    return (m.listOrderWeight[i] ?? 0) + (m.namePrior[name] ?? 0) + m.memoryWeight * wins;
  });
  const max = Math.max(...logits);
  const w = logits.map((l) => Math.exp((l - max) / m.temperature));
  const total = w.reduce((a, x) => a + x, 0);
  let r = mulberry32(hashSeed(`${s.seed}|agent|${key}`))() * total;
  for (let i = 0; i < options.length; i++) {
    r -= w[i];
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}
