// npm run build:scenarios -- <round>: generate and encrypt a round's scenarios into scenarios/.
// The practice pack is generated in the open; every other pack's generator is in the sealed zone.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import type { Scenario } from "../lib/scenario.ts";
import { encrypt, sessionCode } from "../lib/seal.ts";
import { PRACTICE_CODE, practiceScenario } from "./lib/practice.ts";
import { interviewerKey } from "./lib/key.ts";

type RoundConfig = { round: string; scenarios: { id: string; pack: string; seed: number }[] };

const round = process.argv[2];
if (!round) {
  console.error("Usage: npm run build:scenarios -- <round>");
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(`rounds/${round}.json`, "utf8")) as RoundConfig;
const needsSealed = cfg.scenarios.some((s) => s.pack !== "practice");
const key = needsSealed ? interviewerKey() : "";
let generate: ((pack: string, opts: { round: string; id: string; seed: number }) => Scenario) | null = null;
if (needsSealed) {
  const gen = resolve("interviewer/generator/index.ts");
  if (!existsSync(gen)) {
    console.error("This round uses sealed packs. Run `npm run unseal` first.");
    process.exit(1);
  }
  generate = (await import(pathToFileURL(gen).href)).generate;
}
mkdirSync("scenarios", { recursive: true });
for (const s of cfg.scenarios) {
  const scenario = s.pack === "practice" ? practiceScenario(round, s.seed) : generate!(s.pack, { round, id: s.id, seed: s.seed });
  scenario.id = s.id;
  const code = s.pack === "practice" ? PRACTICE_CODE : sessionCode(key, round, s.id);
  writeFileSync(`scenarios/${s.id}.enc`, encrypt(Buffer.from(JSON.stringify(scenario)), { code }));
  console.log(`scenarios/${s.id}.enc  (${s.pack})`);
}
