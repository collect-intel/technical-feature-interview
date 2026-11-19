// SQLite through Node's built-in node:sqlite: a real database with nothing to compile.
// Schema: TDD §4.5. Candidates extend it for their feature.

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
// node:sqlite works but still prints an "experimental" warning; hide just that one.
const emitWarning = process.emitWarning;
process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
  if (String(warning).includes("SQLite is an experimental feature")) return;
  return (emitWarning as (...a: unknown[]) => void).call(process, warning, ...rest);
}) as typeof process.emitWarning;

// Loaded through getBuiltinModule so Next.js's bundler never tries to resolve node:sqlite.
const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");

export const DB_PATH = process.env.DB_PATH ?? "data/app.db";

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  blueprint_hash TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  status TEXT NOT NULL,                -- planned | running | complete | partial
  created_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE TABLE IF NOT EXISTS cells (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  target_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  repeat INTEGER NOT NULL,
  status TEXT NOT NULL,                -- pending | done | failed
  attempts INTEGER NOT NULL DEFAULT 0,
  error_class TEXT
);
CREATE INDEX IF NOT EXISTS cells_run ON cells(run_id);
CREATE TABLE IF NOT EXISTS responses (
  cell_id TEXT PRIMARY KEY REFERENCES cells(id),
  text TEXT NOT NULL,
  tokens_in INTEGER NOT NULL,
  tokens_out INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS verdicts (
  cell_id TEXT NOT NULL REFERENCES cells(id),
  criterion_id TEXT NOT NULL,
  judge_id TEXT NOT NULL,              -- "fn" for point functions
  verdict TEXT,                        -- met | unmet | null when the judge failed
  score REAL,
  raw TEXT,
  PRIMARY KEY (cell_id, criterion_id, judge_id)
);
CREATE TABLE IF NOT EXISTS embeddings (
  content_hash TEXT NOT NULL,
  model TEXT NOT NULL,
  vector BLOB NOT NULL,                -- Float64Array bytes
  PRIMARY KEY (content_hash, model)
);
CREATE TABLE IF NOT EXISTS sim_runs (
  id TEXT PRIMARY KEY,
  params_json TEXT NOT NULL,
  seed INTEGER NOT NULL,
  status TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sim_events (
  sim_run_id TEXT NOT NULL REFERENCES sim_runs(id),
  step INTEGER NOT NULL,
  agent_a INTEGER NOT NULL,
  agent_b INTEGER NOT NULL,
  offered_json TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  success INTEGER NOT NULL,
  PRIMARY KEY (sim_run_id, step)
);
CREATE TABLE IF NOT EXISTS studies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  conditions_json TEXT NOT NULL        -- the agent conditions, e.g. ["interview", "demographic"]
);
CREATE TABLE IF NOT EXISTS study_participants (
  study_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  groups_json TEXT NOT NULL,           -- e.g. {"ideology": "moderate", "race": "...", "gender": "..."}
  PRIMARY KEY (study_id, participant_id)
);
CREATE TABLE IF NOT EXISTS study_items (
  study_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  text TEXT NOT NULL,
  kind TEXT NOT NULL,                  -- categorical | ordinal
  options_json TEXT NOT NULL,          -- ordered options
  PRIMARY KEY (study_id, item_id)
);
CREATE TABLE IF NOT EXISTS study_answers (
  study_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  wave INTEGER NOT NULL,               -- 1 = first answers, 2 = the same person two weeks later
  answer TEXT,                         -- null = didn't answer
  PRIMARY KEY (study_id, participant_id, item_id, wave)
);
CREATE TABLE IF NOT EXISTS call_log (
  request_id TEXT PRIMARY KEY,
  run_id TEXT,
  kind TEXT NOT NULL,                  -- chat | judge | embed | agent | survey
  model TEXT,
  prompt_version TEXT,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL,                -- ok | http_<code> | timeout | malformed | network
  latency_ms INTEGER NOT NULL,
  cost_usd REAL,
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL,                -- queued | leased | done | failed
  lease_until INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_status ON jobs(status);
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  method TEXT NOT NULL,
  method_version TEXT NOT NULL,
  params_json TEXT NOT NULL,
  interpretations_json TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  status TEXT NOT NULL,                -- partial | final | stale
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export type DB = import("node:sqlite").DatabaseSync;

export function openDb(path = DB_PATH): DB {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  return db;
}

export const now = () => new Date().toISOString();
