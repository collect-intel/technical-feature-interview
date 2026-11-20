// The scenario format (TDD §4.3, §5). A scenario is pure data: the mock replays it and the
// runner reads its blueprint, targets and judges. Nothing in this file knows what a given
// scenario is testing.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hashSeed } from "./prng/hashSeed.ts";
import { mulberry32 } from "./prng/mulberry32.ts";

export const SCENARIO_VERSION = 1;
export const SCENARIO_DIR = ".scenario";
export const SCENARIO_FILE = join(SCENARIO_DIR, "scenario.json");

export type Criterion =
  | { id: string; kind: "judge"; text: string }
  | { id: string; kind: "fn"; fn: string; arg: unknown };

export type Item = {
  id: string;
  prompt: string;
  topic?: string;
  criteria: Criterion[];
};

export type Target = {
  id: string;
  provider: string;
  model: string;
  temperature: number;
  systemPromptIndex: number;
  condition?: string;
};

export type Judge = { id: string; provider: string; model: string };

export type Failure = {
  endpoint: "chat" | "judge" | "embed" | "agent" | "survey";
  key: string;
  attempt: number;
  kind: "429" | "500" | "timeout" | "malformed";
};

export type AgentModel = {
  /** Added to an option's logit by its position in the list it was shown (index 0 = first). */
  listOrderWeight: number[];
  /** Added to an option's logit by its name. */
  namePrior: Record<string, number>;
  /** Weight on how often a name succeeded in the agent's memory. */
  memoryWeight: number;
  /** Softmax temperature. */
  temperature: number;
};

export type StudyItem = { id: string; text: string; kind: "categorical" | "ordinal"; options: string[] };

/** A synthetic survey study: people answer twice (two weeks apart); agents answer once per condition. */
export type Study = {
  id: string;
  title: string;
  /** Ways the agents were built, e.g. "interview" and "demographic". */
  conditions: string[];
  participants: { id: string; groups: Record<string, string> }[];
  items: StudyItem[];
  /** key: `${participantId}|${itemId}`; null = the person didn't answer. */
  answers: { wave1: Record<string, string | null>; wave2: Record<string, string | null> };
  /** key: surveyKey(...); null = the agent declined to answer. */
  agentAnswers: Record<string, string | null>;
};

export type Scenario = {
  version: number;
  id: string;
  round: string;
  pack: string;
  title: string;
  seed: number;
  blueprint: { id: string; title: string; systemPrompts: (string | null)[]; items: Item[] };
  targets: Target[];
  judges: Judge[];
  repeats: number;
  /** key: chatKey(...) */
  responses: Record<string, { text: string; tokensIn: number; tokensOut: number }>;
  /** key: judgeKey(...) */
  verdicts: Record<string, { verdict: "met" | "unmet"; score: number; raw?: string }>;
  /** key: sha256 of the content; vectors not listed get a deterministic pseudo-random vector. */
  embeddings: Record<string, number[]>;
  embeddingDim: number;
  agentModel: AgentModel | null;
  study?: Study;
  failures: Failure[];
  rateLimits: Record<string, { capacity: number; refillPerSec: number }>;
  latencyMs: { base: number; jitter: number };
  /** USD per million tokens. */
  pricing: Record<string, { input: number; output: number }>;
};

export function chatKey(targetId: string, itemId: string, repeat: number): string {
  return `${targetId}|${itemId}|${repeat}`;
}

export function judgeKey(
  judgeId: string,
  targetId: string,
  itemId: string,
  repeat: number,
  criterionId: string,
): string {
  return `${judgeId}|${targetId}|${itemId}|${repeat}|${criterionId}`;
}

export function surveyKey(condition: string, participantId: string, itemId: string): string {
  return `${condition}|${participantId}|${itemId}`;
}

export function agentKey(simId: string, step: number, agent: number): string {
  return `${simId}|${step}|${agent}`;
}

export function loadScenario(dir = process.cwd()): Scenario {
  const path = join(dir, SCENARIO_FILE);
  if (!existsSync(path)) {
    throw new Error(
      "No scenario loaded. Run `npm run scenario -- <file>` with the file your interviewer sent.",
    );
  }
  const s = JSON.parse(readFileSync(path, "utf8")) as Scenario;
  if (s.version !== SCENARIO_VERSION) {
    throw new Error(`Scenario version ${s.version} is not supported (expected ${SCENARIO_VERSION}).`);
  }
  return s;
}

/** A deterministic unit vector for content the scenario does not list. */
export function fallbackEmbedding(contentHash: string, dim: number): number[] {
  const rand = mulberry32(hashSeed(contentHash));
  const v = Array.from({ length: dim }, () => rand() * 2 - 1);
  const norm = Math.hypot(...v) || 1;
  return v.map((x) => x / norm);
}

/** Deterministic latency for a request key and attempt. */
export function latencyFor(s: Scenario, key: string, attempt: number): number {
  const r = mulberry32(hashSeed(`${s.seed}|lat|${key}|${attempt}`))();
  return Math.round(s.latencyMs.base + r * s.latencyMs.jitter);
}
