import { route } from "@/server/http.ts";
import { listRuns } from "@/server/queries.ts";
import { launchRun } from "@/server/runner.ts";

export const GET = () => route(listRuns);
export const POST = () => route((app) => ({ id: launchRun(app.db, app.scenario) }));
