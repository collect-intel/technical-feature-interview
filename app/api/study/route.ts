import { route } from "@/server/http.ts";
import { getStudy } from "@/server/queries.ts";

export const GET = () => route(getStudy);
