// The practice scenario: public, with no planted problems. Candidates open it with the code in
// README.md to try the app before their session, and `doctor` uses it to check the setup.
// All text is synthetic.

import { hashSeed } from "../../lib/prng/hashSeed.ts";
import { mulberry32 } from "../../lib/prng/mulberry32.ts";
import { chatKey, judgeKey, SCENARIO_VERSION, type Scenario } from "../../lib/scenario.ts";

export const PRACTICE_CODE = "practice-meadow-lantern";

export function practiceScenario(round = "practice", seed = 7): Scenario {
  const rand = mulberry32(hashSeed(`practice|${seed}`));
  const items = [
    {
      id: "water-cycle",
      topic: "science",
      prompt: "Explain the water cycle to a ten-year-old in under 120 words.",
      criteria: [
        { id: "mentions-evaporation", kind: "fn" as const, fn: "icontains", arg: "evaporat" },
        { id: "age-appropriate", kind: "judge" as const, text: "Uses language a ten-year-old would understand." },
        { id: "accurate", kind: "judge" as const, text: "Describes evaporation, condensation and precipitation correctly." },
      ],
    },
    {
      id: "library-hours",
      topic: "civic",
      prompt: "A resident asks how to find out when their local library is open. Reply helpfully.",
      criteria: [
        { id: "suggests-official-source", kind: "judge" as const, text: "Points to the library's own website or phone line." },
        { id: "no-invented-hours", kind: "judge" as const, text: "Does not invent specific opening hours." },
      ],
    },
    {
      id: "budget-summary",
      topic: "civic",
      prompt: "Summarise in two sentences why a town might publish its annual budget online.",
      criteria: [
        { id: "two-sentences", kind: "fn" as const, fn: "word_count_between", arg: [10, 80] },
        { id: "mentions-transparency", kind: "judge" as const, text: "Mentions transparency or public accountability." },
      ],
    },
    {
      id: "recipe-swap",
      topic: "everyday",
      prompt: "Suggest a substitute for eggs in pancakes and say why it works.",
      criteria: [
        { id: "gives-substitute", kind: "judge" as const, text: "Names at least one workable substitute." },
        { id: "explains-why", kind: "judge" as const, text: "Explains the substitute's role (binding or moisture)." },
      ],
    },
  ];
  const targets = [
    { id: "t-alpha-small", provider: "alpha", model: "alpha/small-1", temperature: 0, systemPromptIndex: 0 },
    { id: "t-alpha-large", provider: "alpha", model: "alpha/large-1", temperature: 0, systemPromptIndex: 0 },
    { id: "t-beta-mid", provider: "beta", model: "beta/mid-2", temperature: 0.7, systemPromptIndex: 0 },
  ];
  const judges = [
    { id: "j1", provider: "gamma", model: "gamma/judge-a" },
    { id: "j2", provider: "gamma", model: "gamma/judge-b" },
    { id: "j3", provider: "delta", model: "delta/judge-c" },
  ];
  const openers = ["Sure!", "Good question.", "Here's a short answer.", "Happy to help."];
  const responses: Scenario["responses"] = {};
  const verdicts: Scenario["verdicts"] = {};
  for (const t of targets) {
    for (const item of items) {
      const key = chatKey(t.id, item.id, 0);
      const opener = openers[Math.floor(rand() * openers.length)];
      const text =
        item.id === "water-cycle"
          ? `${opener} The sun warms water so it evaporates into the air, cools into clouds, and falls again as rain.`
          : `${opener} This is a synthetic practice response from ${t.model} for "${item.id}".`;
      responses[key] = { text, tokensIn: 40 + Math.floor(rand() * 20), tokensOut: 60 + Math.floor(rand() * 60) };
      for (const c of item.criteria) {
        if (c.kind !== "judge") continue;
        for (const j of judges) {
          const met = rand() < 0.7;
          verdicts[judgeKey(j.id, t.id, item.id, 0, c.id)] = { verdict: met ? "met" : "unmet", score: met ? 1 : 0 };
        }
      }
    }
  }
  return {
    version: SCENARIO_VERSION,
    id: "practice",
    round,
    pack: "practice",
    title: "Practice (no planted problems)",
    seed,
    blueprint: { id: "practice-blueprint", title: "Everyday helpfulness (practice)", systemPrompts: [null], items },
    targets,
    judges,
    repeats: 1,
    responses,
    verdicts,
    embeddings: {},
    embeddingDim: 64,
    agentModel: { listOrderWeight: [], namePrior: {}, memoryWeight: 2, temperature: 1 },
    failures: [
      { endpoint: "chat", key: chatKey("t-beta-mid", "library-hours", 0), attempt: 1, kind: "500" },
      { endpoint: "judge", key: judgeKey("j3", "t-alpha-small", "recipe-swap", 0, "explains-why"), attempt: 1, kind: "malformed" },
      { endpoint: "chat", key: chatKey("t-alpha-large", "budget-summary", 0), attempt: 1, kind: "429" },
    ],
    rateLimits: { alpha: { capacity: 20, refillPerSec: 10 } },
    latencyMs: { base: 30, jitter: 60 },
    pricing: {
      "alpha/small-1": { input: 0.15, output: 0.6 },
      "alpha/large-1": { input: 2.5, output: 10 },
      "beta/mid-2": { input: 0.5, output: 1.5 },
      "gamma/judge-a": { input: 0.3, output: 1.2 },
      "gamma/judge-b": { input: 0.3, output: 1.2 },
      "delta/judge-c": { input: 0.2, output: 0.8 },
    },
  };
}
