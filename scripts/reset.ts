// npm run reset: delete the local database. The loaded scenario stays; `npm run dev` starts a fresh run.
import { rmSync } from "node:fs";
rmSync("data", { recursive: true, force: true });
console.log("Database deleted. (Re)start `npm run dev` to begin a fresh run.");
