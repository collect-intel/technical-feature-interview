import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { test } from "node:test";

test("no tracked file contains sealed interviewer material in plain text", { skip: !existsSync(".git") }, () => {
  const out = spawnSync(process.execPath, ["scripts/check-canary.ts"], { encoding: "utf8" });
  assert.equal(out.status, 0, out.stderr);
});
