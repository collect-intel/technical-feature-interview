// Builds a synthetic survey study (no real people). Each person has an underlying answer per
// item; their two waves and each agent condition reproduce it with the probabilities given.

import { hashSeed } from "./prng/hashSeed.ts";
import { mulberry32 } from "./prng/mulberry32.ts";
import { surveyKey, type Study, type StudyItem } from "./scenario.ts";

const ITEM_BANK: Omit<StudyItem, "id">[] = [
  { text: "How much confidence do you have in your local library service?", kind: "ordinal", options: ["A great deal", "Only some", "Hardly any"] },
  { text: "Should the town spend more, the same, or less on parks?", kind: "ordinal", options: ["More", "About the same", "Less"] },
  { text: "Which matters most when choosing where to live?", kind: "categorical", options: ["Cost", "Schools", "Commute", "Community", "Safety"] },
  { text: "How often do you attend public meetings?", kind: "ordinal", options: ["Often", "Sometimes", "Rarely", "Never"] },
  { text: "Generally speaking, can most people be trusted?", kind: "categorical", options: ["Can trust", "Can't be too careful", "Depends"] },
  { text: "How interested are you in local news?", kind: "ordinal", options: ["Very", "Somewhat", "Not very", "Not at all"] },
  { text: "Which should the council prioritise this year?", kind: "categorical", options: ["Housing", "Transport", "Climate", "Jobs"] },
  { text: "How satisfied are you with your neighbourhood?", kind: "ordinal", options: ["Very satisfied", "Satisfied", "Dissatisfied", "Very dissatisfied"] },
];

const GROUPS = {
  ideology: ["liberal", "moderate", "conservative"],
  race: ["group-a", "group-b", "group-c"],
  gender: ["woman", "man", "nonbinary"],
};

export type StudyOptions = {
  id: string;
  seed: number;
  participants: number;
  items: number;
  /** Probability each person repeats their own answer two weeks later. */
  retest: number;
  /** Per agent condition: probability the agent gives the person's underlying answer. */
  conditions: Record<string, number>;
};

export function syntheticStudy(o: StudyOptions): Study {
  const rand = mulberry32(hashSeed(`study|${o.id}|${o.seed}`));
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const items: StudyItem[] = Array.from({ length: o.items }, (_, i) => ({ id: `q${String(i + 1).padStart(3, "0")}`, ...ITEM_BANK[i % ITEM_BANK.length] }));
  const participants = Array.from({ length: o.participants }, (_, i) => ({
    id: `p${String(i + 1).padStart(4, "0")}`,
    groups: Object.fromEntries(Object.entries(GROUPS).map(([k, v]) => [k, pick(v)])),
  }));
  const other = (item: StudyItem, not: string) => pick(item.options.filter((x) => x !== not));
  const wave1: Record<string, string | null> = {};
  const wave2: Record<string, string | null> = {};
  const agentAnswers: Record<string, string | null> = {};
  for (const p of participants) {
    for (const item of items) {
      const truth = pick(item.options);
      const key = `${p.id}|${item.id}`;
      wave1[key] = truth;
      wave2[key] = rand() < o.retest ? truth : other(item, truth);
      for (const [condition, prob] of Object.entries(o.conditions)) {
        agentAnswers[surveyKey(condition, p.id, item.id)] = rand() < prob ? truth : other(item, truth);
      }
    }
  }
  return { id: o.id, title: "Neighbourhood attitudes (synthetic)", conditions: Object.keys(o.conditions), participants, items, answers: { wave1, wave2 }, agentAnswers };
}
