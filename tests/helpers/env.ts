// Shared test helpers: a mock on a free port, a throwaway database, and the analysis contract.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMockServer } from "../../mock/server.ts";
import type { Scenario } from "../../lib/scenario.ts";
import { practiceScenario } from "../../lib/practice.ts";
import { openDb, type DB } from "../../server/db.ts";

export async function startMock(scenario: Scenario): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createMockServer(scenario);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => { server.closeAllConnections(); server.close(() => r()); }),
  };
}

export function tempDb(): { path: string; db: DB } {
  const path = join(mkdtempSync(join(tmpdir(), "rfi-test-")), "test.db");
  return { path, db: openDb(path) };
}

/** The practice scenario with fast, failure-free defaults; override what a test needs. */
export function testScenario(overrides: Partial<Scenario> = {}): Scenario {
  return { ...practiceScenario("test", 7), latencyMs: { base: 0, jitter: 0 }, failures: [], rateLimits: {}, ...overrides };
}

export type AnalysisRow = {
  run_id: string;
  method: string;
  method_version: string;
  params_json: string;
  interpretations_json: string;
  input_hash: string;
  status: string;
  result_json: string;
};

/**
 * Run a method through analysis/commands.json, the way the app would, and return its newest row.
 * Async on purpose: the test's mock runs in this process and must keep serving while the command runs.
 */
export async function runAnalysis(
  method: string,
  id: string,
  env: { DB_PATH: string; MOCK_URL?: string; LAB_PARAMS?: string },
  timeoutMs = 120_000,
): Promise<AnalysisRow> {
  // ANALYSIS_COMMANDS lets interviewer CI run these same tests against the reference solutions.
  const commands = JSON.parse(readFileSync(process.env.ANALYSIS_COMMANDS ?? "analysis/commands.json", "utf8")) as Record<string, string[]>;
  const cmd = commands[method];
  if (!cmd) throw new Error(`analysis/commands.json has no entry for "${method}"`);
  const script = cmd.find((a) => a.endsWith(".ts") || a.endsWith(".py"));
  if (cmd[0] === "node" && script && !existsSync(script)) {
    throw new Error(`Not built yet: ${script} doesn't exist. Write it, or point analysis/commands.json at your Python module.`);
  }
  const [bin, ...args] = cmd;
  const child = spawn(bin === "node" ? process.execPath : bin, [...(bin === "node" ? ["--disable-warning=ExperimentalWarning"] : []), ...args, id], {
    env: { ...process.env, ...env },
  });
  let stderr = "";
  child.stderr.on("data", (c) => (stderr += c));
  child.stdout.resume();
  const code = await new Promise<number | string>((resolve) => {
    const timer = setTimeout(() => { child.kill(); resolve("timeout"); }, timeoutMs);
    child.on("close", (c, sig) => { clearTimeout(timer); resolve(c ?? sig ?? "unknown"); });
  });
  if (code !== 0) throw new Error(`"${cmd.join(" ")} ${id}" exited with ${code}.\n${stderr}`);
  const db = openDb(env.DB_PATH);
  const row = db
    .prepare("SELECT * FROM analyses WHERE run_id = ? AND method = ? ORDER BY created_at DESC, rowid DESC LIMIT 1")
    .get(id, method) as AnalysisRow | undefined;
  db.close();
  if (!row) throw new Error(`"${method}" exited cleanly but wrote no analyses row for ${id}.`);
  for (const col of ["method_version", "params_json", "interpretations_json", "input_hash", "status", "result_json"] as const) {
    if (!row[col]) throw new Error(`The analyses row is missing ${col}.`);
  }
  return row;
}
