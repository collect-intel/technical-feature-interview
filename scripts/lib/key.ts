// The interviewer key: from INTERVIEWER_KEY, or from a git-ignored .interviewer-key file.
import { existsSync, readFileSync } from "node:fs";

export function interviewerKey(): string {
  const fromEnv = process.env.INTERVIEWER_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (existsSync(".interviewer-key")) return readFileSync(".interviewer-key", "utf8").trim();
  console.error(
    "No interviewer key. Set INTERVIEWER_KEY, or put the key in .interviewer-key (git-ignored).\n" +
      "Candidates don't need this: it opens the sealed interviewer zone only.",
  );
  process.exit(1);
}
