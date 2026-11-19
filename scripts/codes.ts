// npm run codes -- <round>: the session-code sheet for a round, derived from the interviewer key.
import { readFileSync } from "node:fs";
import { sessionCode } from "../lib/seal.ts";
import { PRACTICE_CODE } from "./lib/practice.ts";
import { interviewerKey } from "./lib/key.ts";

const round = process.argv[2];
if (!round) {
  console.error("Usage: npm run codes -- <round>");
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(`rounds/${round}.json`, "utf8")) as { scenarios: { id: string; pack: string }[] };
const key = cfg.scenarios.some((s) => s.pack !== "practice") ? interviewerKey() : "";
for (const s of cfg.scenarios) {
  const code = s.pack === "practice" ? PRACTICE_CODE : sessionCode(key, round, s.id);
  console.log(`${s.id.padEnd(28)} ${s.pack.padEnd(22)} ${code}`);
}
