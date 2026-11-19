// The mock model gateway (mock/gateway.ts), served by the app at /mock/*.
import { getApp } from "@/server/app.ts";

async function handle(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const out = await getApp().gateway(req.method, `/${path.join("/")}`, req.method === "POST" ? await req.text() : "");
  return new Response(out.body, { status: out.status, headers: out.headers });
}

export const GET = handle;
export const POST = handle;
