// npm run scenario -- <code>: open the scenario this code belongs to and start from a clean database.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { SCENARIO_DIR, SCENARIO_FILE, type Scenario } from "../lib/scenario.ts";
import { decrypt, WrongSecretError } from "../lib/seal.ts";

const code = process.argv.slice(2).join(" ").trim();
if (!code) {
  console.error("Usage: npm run scenario -- <code>   (the practice code is in README.md)");
  process.exit(1);
}
for (const f of readdirSync("scenarios").filter((f) => f.endsWith(".enc")).sort()) {
  let plaintext: Buffer;
  try {
    plaintext = decrypt(readFileSync(`scenarios/${f}`), { code });
  } catch (e) {
    if (e instanceof WrongSecretError) continue;
    throw e;
  }
  const scenario = JSON.parse(plaintext.toString("utf8")) as Scenario;
  mkdirSync(SCENARIO_DIR, { recursive: true });
  writeFileSync(SCENARIO_FILE, JSON.stringify(scenario, null, 2));
  rmSync("data", { recursive: true, force: true });
  console.log(`Opened "${scenario.title}". The database was reset; \`npm run dev\` starts a fresh run.`);
  process.exit(0);
}
console.error("That code doesn't open any scenario in scenarios/. Check the words and try again.");
process.exit(1);
