// Calls to the model gateway (the local mock). Every attempt is written to call_log with its
// request id, model, prompt version, latency and cost. Transient failures retry with back-off,
// honouring Retry-After; anything else is terminal.

import { randomUUID } from "node:crypto";
import type { Scenario } from "../lib/scenario.ts";
import { now, type DB } from "./db.ts";

/** Read on every call, so tests (and you) can point the gateway elsewhere at runtime. */
export const mockUrl = () => process.env.MOCK_URL ?? `http://localhost:${process.env.PORT ?? 3000}/mock`;

export type RetryPolicy = { maxAttempts: number; baseDelayMs: number; timeoutMs: number };
export const DEFAULT_RETRY: RetryPolicy = { maxAttempts: 4, baseDelayMs: 200, timeoutMs: 5_000 };

export class CallFailed extends Error {
  errorClass: string;
  constructor(errorClass: string, message: string) {
    super(message);
    this.errorClass = errorClass;
  }
}

type CallMeta = {
  runId: string | null;
  kind: "chat" | "judge" | "embed" | "agent" | "survey";
  model: string | null;
  promptVersion: string | null;
};

export async function call<T>(
  db: DB,
  scenario: Scenario,
  path: string,
  body: unknown,
  meta: CallMeta,
  policy: RetryPolicy = DEFAULT_RETRY,
): Promise<T> {
  let lastClass = "unknown";
  let lastMessage = "";
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    const started = Date.now();
    let status = "ok";
    let retryAfterMs = 0;
    try {
      const res = await fetch(`${mockUrl()}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(policy.timeoutMs),
      });
      const text = await res.text();
      if (res.ok) {
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          status = "malformed";
          throw new CallFailed("malformed", "response body was not valid JSON");
        }
        log(db, scenario, meta, attempt, status, Date.now() - started, parsed?.usage);
        return parsed as T;
      }
      status = `http_${res.status}`;
      retryAfterMs = Number(res.headers.get("retry-after") ?? 0) * 1000;
      if (res.status !== 429 && res.status < 500) {
        log(db, scenario, meta, attempt, status, Date.now() - started);
        throw new CallFailed("terminal", `${path} returned ${res.status}: ${text}`);
      }
      throw new CallFailed(res.status === 429 ? "rate_limited" : "server_error", `${path} returned ${res.status}`);
    } catch (e) {
      if (e instanceof CallFailed && e.errorClass === "terminal") throw e;
      if (e instanceof CallFailed) {
        lastClass = e.errorClass;
        lastMessage = e.message;
      } else if ((e as Error).name === "TimeoutError") {
        status = "timeout";
        lastClass = "timeout";
        lastMessage = `${path} timed out after ${policy.timeoutMs}ms`;
      } else {
        status = "network";
        lastClass = "network";
        lastMessage = (e as Error).message;
      }
      log(db, scenario, meta, attempt, status, Date.now() - started);
      if (attempt < policy.maxAttempts) {
        const backoff = policy.baseDelayMs * 2 ** (attempt - 1);
        await sleep(Math.max(backoff, retryAfterMs));
      }
    }
  }
  throw new CallFailed(lastClass, `gave up after ${policy.maxAttempts} attempts: ${lastMessage}`);
}

function log(
  db: DB,
  scenario: Scenario,
  meta: CallMeta,
  attempt: number,
  status: string,
  latencyMs: number,
  usage?: { input?: number; output?: number },
) {
  const price = meta.model ? scenario.pricing[meta.model] : undefined;
  const cost =
    price && usage ? ((usage.input ?? 0) * price.input + (usage.output ?? 0) * price.output) / 1e6 : null;
  db.prepare(
    `INSERT INTO call_log (request_id, run_id, kind, model, prompt_version, attempt, status, latency_ms, cost_usd, at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), meta.runId, meta.kind, meta.model, meta.promptVersion, attempt, status, latencyMs, cost, now());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
