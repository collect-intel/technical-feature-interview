import { route } from "@/server/http.ts";
import { scenarioSummary } from "@/server/queries.ts";

export const GET = () => route(scenarioSummary);
