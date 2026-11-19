import { route } from "@/server/http.ts";
import { getRun } from "@/server/queries.ts";

export const GET = async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return route((app) => getRun(app, id));
};
