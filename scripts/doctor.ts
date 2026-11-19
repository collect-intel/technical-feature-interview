// npm run doctor: check this machine can run the interview. Send it to candidates 48 h ahead.
import { createServer } from "node:net";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decrypt } from "../lib/seal.ts";
import { PRACTICE_CODE } from "../server/app.ts";

const results: [string, boolean, string][] = [];
const check = async (name: string, fn: () => unknown | Promise<unknown>) => {
  try {
    const detail = await fn();
    results.push([name, true, typeof detail === "string" ? detail : ""]);
  } catch (e) {
    results.push([name, false, (e as Error).message]);
  }
};

await check("Node 22.18 or newer", () => {
  const [maj, min] = process.versions.node.split(".").map(Number);
  if (maj < 22 || (maj === 22 && min < 18)) throw new Error(`found ${process.versions.node}; install Node 22 LTS or newer`);
  return process.versions.node;
});
await check("Built-in SQLite", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const path = join(tmpdir(), `rfi-doctor-${process.pid}.db`);
  const db = new DatabaseSync(path);
  db.exec("CREATE TABLE t (x); INSERT INTO t VALUES (1);");
  const ok = (db.prepare("SELECT x FROM t").get() as { x: number }).x === 1;
  db.close();
  rmSync(path, { force: true });
  if (!ok) throw new Error("read back the wrong value");
});
for (const port of [Number(process.env.PORT ?? 3000)]) {
  await check(`Port ${port} free`, () => new Promise<void>((res, rej) => {
    const s = createServer().once("error", () => rej(new Error(`something is using port ${port}; stop it, or run with PORT=3001`)));
    s.listen(port, () => s.close(() => res()));
  }));
}
await check("Practice scenario opens", () => {
  const s = JSON.parse(decrypt(readFileSync("scenarios/practice.enc"), { code: PRACTICE_CODE }).toString());
  return s.title;
});
await check("Dependencies installed", () => {
  readFileSync("node_modules/next/package.json");
});

for (const [name, ok, detail] of results) console.log(`${ok ? "✔" : "✘"} ${name}${detail ? `  (${detail})` : ""}`);
const failed = results.filter((r) => !r[1]).length;
console.log(failed ? `\n${failed} check(s) failed. Fix these before your session, or reply to your interviewer.` : "\nAll good. Run `npm run dev` and open http://localhost:3000");
process.exit(failed ? 1 : 0);
