// What the given API routes return. Each brief's endpoint is the candidate's to design.

import type { App } from "./app.ts";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function scenarioSummary({ scenario: s }: App) {
  return { id: s.id, round: s.round, pack: s.pack, title: s.title };
}

export function listRuns({ db }: App) {
  return db.prepare("SELECT id, scenario_id, manifest_hash, status, created_at, finished_at FROM runs ORDER BY created_at DESC").all();
}

export function getRun({ db }: App, id: string) {
  const run = db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as any;
  if (!run) throw new HttpError(404, "run not found");
  const cells = db.prepare("SELECT status, COUNT(*) AS n FROM cells WHERE run_id = ? GROUP BY status").all(id);
  const calls = db
    .prepare("SELECT kind, status, COUNT(*) AS n, ROUND(SUM(COALESCE(cost_usd, 0)), 6) AS cost_usd FROM call_log WHERE run_id = ? GROUP BY kind, status")
    .all(id);
  const { manifest_json, ...rest } = run;
  return { ...rest, manifest: JSON.parse(manifest_json), cells, calls };
}

export function getRunCells({ db }: App, id: string) {
  const cells = db
    .prepare(
      `SELECT c.id, c.target_id, c.item_id, c.repeat, c.status, c.attempts, c.error_class, r.text AS response
       FROM cells c LEFT JOIN responses r ON r.cell_id = c.id WHERE c.run_id = ? ORDER BY c.item_id, c.target_id, c.repeat`,
    )
    .all(id) as any[];
  const verdicts = db.prepare("SELECT v.* FROM verdicts v JOIN cells c ON c.id = v.cell_id WHERE c.run_id = ?").all(id) as any[];
  const byCell = new Map<string, any[]>();
  for (const v of verdicts) byCell.set(v.cell_id, [...(byCell.get(v.cell_id) ?? []), v]);
  return cells.map((c) => ({ ...c, verdicts: byCell.get(c.id) ?? [] }));
}

export function getStudy({ db, scenario: s }: App) {
  if (!s.study) return null;
  const count = (sql: string) => (db.prepare(sql).get(s.study!.id) as { n: number }).n;
  return {
    id: s.study.id,
    title: s.study.title,
    conditions: s.study.conditions,
    participants: count("SELECT COUNT(*) AS n FROM study_participants WHERE study_id = ?"),
    items: count("SELECT COUNT(*) AS n FROM study_items WHERE study_id = ?"),
  };
}

export function getJob({ db }: App, id: string) {
  return db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) ?? null;
}
