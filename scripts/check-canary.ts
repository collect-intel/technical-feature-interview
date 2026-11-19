// Fails if any tracked (or, with --staged, staged) file contains sealed-zone plaintext (TDD §5.4).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { CANARY } from "../lib/canary.ts";

const staged = process.argv.includes("--staged");
const files = execFileSync("git", staged ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR"] : ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const hits = files.filter((f) => existsSync(f) && !f.endsWith(".sealed") && !f.endsWith(".enc") && readFileSync(f).includes(CANARY));
if (hits.length) {
  console.error(`Refusing: these files contain sealed interviewer material in plain text:\n  ${hits.join("\n  ")}`);
  console.error("Keep it inside interviewer/ (git-ignored) and run `npm run seal`.");
  process.exit(1);
}
