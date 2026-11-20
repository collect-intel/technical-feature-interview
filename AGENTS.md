# AGENTS.md

Mini Studio: a Next.js app (App Router) with an evaluation runner, built-in SQLite and a mock
model gateway, all in one server process. Server code under `server/`, `lib/` and `mock/` is
plain TypeScript that Node also runs directly (tests and scripts use type stripping), so
imports carry `.ts` extensions, type-only imports use `import type`, and parameter properties
and enums aren't allowed.

## Commands

- `npm run dev`: the app at http://localhost:3000 (uses the practice scenario until you load another)
- `npm run scenario -- <file or URL>`: load the scenario your interviewer sends and reset the database; restart `npm run dev` after (`npm run scenario -- practice` goes back)
- `npm test`, `npm run test:given`, `npm run test:known-answer`
- One test file: `node --test tests/known-answer/panel.test.ts`
- `npm run typecheck`, `npm run build`

## Layout

- `app/`: pages and API route handlers (`app/api/**/route.ts`); `app/mock/[...path]` serves the mock gateway at `/mock/*`
- `instrumentation.ts`: starts the job worker when the server boots
- `server/app.ts`: the one app instance (database, scenario, gateway, worker)
- `server/runner.ts`: plan → cell → finish, with jobs leased in SQLite
- `server/gateway.ts`: calls to the mock, with retries and a `call_log` row per attempt
- `server/db.ts`: schema
- `server/study.ts`: loads a scenario's survey study into the `studies` and `study_*` tables
- `server/queries.ts`: what the given API routes return
- `mock/gateway.ts`: replays the loaded scenario (`.scenario/scenario.json`)
- `analysis/README.md`: the contract a feature's computation follows; `analysis/commands.json` maps each method to its command
- `briefs/`: feature briefs; each one lists its acceptance criteria and the `result_json` shape its test expects

## Conventions

- Record failures as failures (null, with a reason), never as zero.
- Every analyses row records its method version, parameters, interpretations and input hash.
- Don't edit `tests/known-answer/`; make the tests pass.
- Don't commit `.scenario/` or `data/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
