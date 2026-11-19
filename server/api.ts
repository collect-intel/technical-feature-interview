// The API (TDD §4.7). Given endpoints only; each brief's endpoint is the candidate's to design.
// The job worker runs in this process.

import { createServer, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";
import { loadScenario, type Scenario } from "../lib/scenario.ts";
import { openDb, type DB } from "./db.ts";
import { mockUrl } from "./gateway.ts";
import { launchRun, startWorker } from "./runner.ts";

export const API_PORT = Number(process.env.API_PORT ?? 3000);

type Route = (db: DB, scenario: Scenario, params: string[], body: any) => unknown;

const routes: [string, RegExp, Route][] = [
  ["GET", /^\/api\/health$/, () => ({ ok: true })],
  ["GET", /^\/api\/scenario$/, (_db, s) => ({ id: s.id, round: s.round, pack: s.pack, title: s.title })],
  [
    "GET",
    /^\/api\/runs$/,
    (db) => db.prepare("SELECT id, scenario_id, manifest_hash, status, created_at, finished_at FROM runs ORDER BY created_at DESC").all(),
  ],
  [
    "POST",
    /^\/api\/runs$/,
    (db, s) => ({ id: launchRun(db, s) }),
  ],
  [
    "GET",
    /^\/api\/runs\/([\w-]+)$/,
    (db, _s, [id]) => {
      const run = db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as any;
      if (!run) throw new HttpError(404, "run not found");
      const cells = db.prepare("SELECT status, COUNT(*) AS n FROM cells WHERE run_id = ? GROUP BY status").all(id);
      const calls = db
        .prepare("SELECT kind, status, COUNT(*) AS n, ROUND(SUM(COALESCE(cost_usd, 0)), 6) AS cost_usd FROM call_log WHERE run_id = ? GROUP BY kind, status")
        .all(id);
      return { ...run, manifest: JSON.parse(run.manifest_json), manifest_json: undefined, cells, calls };
    },
  ],
  [
    "GET",
    /^\/api\/runs\/([\w-]+)\/cells$/,
    (db, _s, [id]) => {
      const cells = db
        .prepare(
          `SELECT c.id, c.target_id, c.item_id, c.repeat, c.status, c.attempts, c.error_class, r.text AS response
           FROM cells c LEFT JOIN responses r ON r.cell_id = c.id WHERE c.run_id = ? ORDER BY c.item_id, c.target_id, c.repeat`,
        )
        .all(id) as any[];
      const verdicts = db
        .prepare("SELECT v.* FROM verdicts v JOIN cells c ON c.id = v.cell_id WHERE c.run_id = ?")
        .all(id) as any[];
      const byCell = new Map<string, any[]>();
      for (const v of verdicts) byCell.set(v.cell_id, [...(byCell.get(v.cell_id) ?? []), v]);
      return cells.map((c) => ({ ...c, verdicts: byCell.get(c.id) ?? [] }));
    },
  ],
  [
    "GET",
    /^\/api\/jobs\/([^/]+)$/,
    (db, _s, [id]) => db.prepare("SELECT * FROM jobs WHERE id = ?").get(decodeURIComponent(id)) ?? null,
  ],
];

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createApi(db: DB, scenario: Scenario) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    for (const [method, pattern, route] of routes) {
      const m = req.method === method ? pattern.exec(url.pathname) : null;
      if (!m) continue;
      try {
        const body = method === "POST" ? await readBody(req) : null;
        return send(res, 200, route(db, scenario, m.slice(1), body));
      } catch (e) {
        return send(res, e instanceof HttpError ? e.status : 500, { error: (e as Error).message });
      }
    }
    send(res, 404, { error: "not found" });
  });
}

function readBody(req: import("node:http").IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => {
      try {
        resolve(d ? JSON.parse(d) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function waitForMock(timeoutMs = 15_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      if ((await fetch(`${mockUrl()}/health`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`mock gateway not reachable at ${mockUrl()}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const scenario = loadScenario();
  const db = openDb();
  startWorker(db, scenario);
  createApi(db, scenario).listen(API_PORT, async () => {
    console.log(`api     http://localhost:${API_PORT}`);
    const runs = db.prepare("SELECT COUNT(*) AS n FROM runs").get() as { n: number };
    if (runs.n === 0) {
      await waitForMock();
      console.log(`api     launched first run ${launchRun(db, scenario)}`);
    }
  });
}
