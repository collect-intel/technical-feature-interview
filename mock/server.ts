// The mock gateway on its own HTTP port. The app serves the same gateway at /mock; tests use this
// so each test gets a fresh gateway (attempt counts start from 1) on a free port.

import { createServer, type Server } from "node:http";
import type { Scenario } from "../lib/scenario.ts";
import { createGateway } from "./gateway.ts";

export function createMockServer(scenario: Scenario): Server {
  const handle = createGateway(scenario);
  return createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      const out = await handle(req.method ?? "GET", req.url ?? "/", body);
      res.writeHead(out.status, out.headers);
      res.end(out.body);
    });
  });
}
