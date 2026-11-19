// postinstall: point git at .githooks so the canary check runs before every commit.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
if (existsSync(".git")) {
  try {
    execFileSync("git", ["config", "core.hooksPath", ".githooks"]);
  } catch {}
}
