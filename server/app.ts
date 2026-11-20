// One app instance per server process: database, scenario, mock gateway and job worker.
// Kept on globalThis because Next.js can load this module more than once (instrumentation,
// route handlers, hot reload); every caller gets the same instance.

import { existsSync } from "node:fs";
import { createGateway } from "../mock/gateway.ts";
import { practiceScenario } from "../lib/practice.ts";
import { loadScenario, SCENARIO_FILE, type Scenario } from "../lib/scenario.ts";
import { openDb, type DB } from "./db.ts";
import { mockUrl } from "./gateway.ts";
import { launchRun, startWorker, type Worker } from "./runner.ts";
import { loadStudy } from "./study.ts";

export type App = { db: DB; scenario: Scenario; gateway: ReturnType<typeof createGateway>; worker: Worker | null };

const g = globalThis as typeof globalThis & { __mini_studio?: App };

export function getApp(): App {
  if (g.__mini_studio) return g.__mini_studio;
  // The session's scenario if one was loaded (`npm run scenario`), otherwise the practice one.
  const scenario = existsSync(SCENARIO_FILE) ? loadScenario() : practiceScenario();
  const db = openDb();
  loadStudy(db, scenario);
  g.__mini_studio = { db, scenario, gateway: createGateway(scenario), worker: null };
  return g.__mini_studio;
}

/** Start the job worker once the server answers, and launch the first run on an empty database. */
export function startBackground() {
  const app = getApp();
  if (app.worker) return;
  app.worker = startWorker(app.db, app.scenario);
  void (async () => {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(`${mockUrl()}/health`)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }
    const runs = app.db.prepare("SELECT COUNT(*) AS n FROM runs").get() as { n: number };
    if (runs.n === 0) console.log(`Mini Studio: launched first run ${launchRun(app.db, app.scenario)} (${app.scenario.title})`);
  })();
}
