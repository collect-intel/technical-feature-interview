// npm run dev: mock gateway (:4010), API + worker (:3000) and web (:5173), with prefixed logs.
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { SCENARIO_FILE } from "../lib/scenario.ts";

if (!existsSync(SCENARIO_FILE)) {
  console.error("No scenario loaded yet. Run `npm run scenario -- <code>` first (the practice code is in README.md).");
  process.exit(1);
}

const node = [process.execPath, "--disable-warning=ExperimentalWarning"];
const procs: [string, string[], string?][] = [
  ["mock", [...node, "mock/server.ts"]],
  ["api", [...node, "server/api.ts"]],
  ["web", [process.execPath, "node_modules/vite/bin/vite.js", "--config", "apps/web/vite.config.ts", "--clearScreen", "false"]],
];
const children: ChildProcess[] = [];
for (const [name, [cmd, ...args]] of procs) {
  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], env: process.env });
  const prefix = (chunk: Buffer) =>
    chunk.toString().split("\n").filter(Boolean).forEach((l) => console.log(`[${name}] ${l}`));
  child.stdout!.on("data", prefix);
  child.stderr!.on("data", prefix);
  child.on("exit", (code) => {
    console.log(`[${name}] exited (${code})`);
    shutdown(code ?? 0);
  });
  children.push(child);
}
let stopping = false;
function shutdown(code: number) {
  if (stopping) return;
  stopping = true;
  for (const c of children) c.kill();
  setTimeout(() => process.exit(code), 300);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
