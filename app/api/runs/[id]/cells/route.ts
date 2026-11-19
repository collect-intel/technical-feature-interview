import { route } from "@/server/http.ts";
import { getRunCells } from "@/server/queries.ts";

export const GET = async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return route((app) => getRunCells(app, id));
};
