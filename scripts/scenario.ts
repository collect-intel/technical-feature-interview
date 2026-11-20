// npm run scenario -- <file or URL>: load the scenario your interviewer sends at the start of the
// session, and start from a clean database. `npm run scenario -- practice` goes back to practice.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { SCENARIO_DIR, SCENARIO_FILE, type Scenario } from "../lib/scenario.ts";

const src = process.argv.slice(2).join(" ").trim();
if (!src) {
  console.error("Usage: npm run scenario -- <file or URL from your interviewer>   (or: practice)");
  process.exit(1);
}

rmSync("data", { recursive: true, force: true });
if (src === "practice") {
  rmSync(SCENARIO_DIR, { recursive: true, force: true });
  console.log("Back to the practice scenario. The database was reset. (Re)start `npm run dev`.");
  process.exit(0);
}

let text: string;
try {
  text = /^https?:\/\//.test(src) ? await (await fetch(src)).text() : readFileSync(src, "utf8");
} catch (e) {
  console.error(`Couldn't read ${src}: ${(e as Error).message}`);
  process.exit(1);
}
let scenario: Scenario;
try {
  scenario = JSON.parse(text) as Scenario;
  if (!scenario.id || !scenario.blueprint) throw new Error("missing id or blueprint");
} catch (e) {
  console.error(`${src} isn't a scenario file (${(e as Error).message}). Check you have the file your interviewer sent.`);
  process.exit(1);
}
mkdirSync(SCENARIO_DIR, { recursive: true });
writeFileSync(SCENARIO_FILE, JSON.stringify(scenario, null, 2));
console.log(`Loaded "${scenario.title}". The database was reset. (Re)start \`npm run dev\` to begin a fresh run.`);
