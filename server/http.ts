// Small helpers for the Next.js route handlers.
import { getApp, type App } from "./app.ts";
import { HttpError } from "./queries.ts";

export function route(fn: (app: App) => unknown | Promise<unknown>): Promise<Response> {
  return (async () => {
    try {
      return Response.json(await fn(getApp()));
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: e instanceof HttpError ? e.status : 500 });
    }
  })();
}
