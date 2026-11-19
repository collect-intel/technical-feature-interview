# AGENTS.md

Mini Studio: an evaluation runner (Node + TypeScript + built-in SQLite) with a local mock
model gateway and a Vite + React web app. Node runs the TypeScript directly through type
stripping: no build step. Imports carry `.ts` extensions, type-only imports use
`import type`, and parameter properties and enums aren't allowed.

## Commands

- `npm run scenario -- <code>`: load a scenario (resets the database)
- `npm run dev`: mock :4010, API + worker :3000, web :5173
- `npm test`, `npm run test:given`, `npm run test:known-answer`
- One test file: `node --test tests/known-answer/panel.test.ts`
- `npm run typecheck`

## Layout

- `server/runner.ts`: plan → cell → finish, with jobs leased in SQLite
- `server/gateway.ts`: calls to the mock, with retries and a `call_log` row per attempt
- `server/db.ts`: schema
- `server/api.ts`: HTTP routes
- `mock/server.ts`: replays the loaded scenario (`.scenario/scenario.json`)
- `apps/web/src/`: pages and the hash router
- `analysis/README.md`: the contract a feature's computation follows; `analysis/commands.json` maps each method to its command
- `briefs/`: feature briefs; each one lists its acceptance criteria and the `result_json` shape its test expects

## Conventions

- Record failures as failures (null, with a reason), never as zero.
- Every analyses row records its method version, parameters, interpretations and input hash.
- Don't edit `tests/known-answer/`; make the tests pass.
- Don't commit `.scenario/`, `data/` or anything under `interviewer/`.
