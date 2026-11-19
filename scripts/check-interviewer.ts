// npm run check:interviewer: run before each round. Needs the unsealed interviewer zone
// (`npm run unseal`). Checks that the reference solutions pass every known-answer test.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync("interviewer/reference/commands.json")) {
  console.error("Run `npm run unseal` first: this check needs the interviewer zone.");
  process.exit(1);
}
const out = spawnSync(
  process.execPath,
  ["--disable-warning=ExperimentalWarning", "--test", "--test-concurrency=1", "tests/known-answer/*.test.ts"],
  { stdio: "inherit", env: { ...process.env, ANALYSIS_COMMANDS: "interviewer/reference/commands.json" } },
);
if (out.status === 0) console.log("\nReference solutions pass every known-answer test.");
process.exit(out.status ?? 1);
