# Research-feature interview

A small app, **Mini Studio**, for a two-hour interview: you read a research paper, plan with
your own AI tools, and build one feature end to end on top of a working evaluation runner.

> **This is a sandbox exercise.** All data is synthetic, there are no real model calls, and
> nothing you build here is used in any CIP product.

## Before your session (about 10 minutes)

You need **Node 22.18 or newer** (Node 22 LTS or 24). No Docker, no API keys, no database to install.

```bash
npm install
npm run doctor                                   # checks your machine; tell us if anything fails
npm run scenario -- practice meadow lantern      # opens the practice scenario
npm run dev                                      # http://localhost:5173
```

The practice scenario runs a small evaluation so you can see the app working. Try it, read
the brief for your paper, and look around the code. At the start of the session your
interviewer reads you a six-word code that opens your session's scenario:

```bash
npm run scenario -- <the six words>
npm run dev
```

## What's here

| Path | What it is |
|---|---|
| `briefs/` | One feature brief per paper. You'll be told which one is yours |
| `docs/RUBRIC.md` | How the session is scored |
| `docs/TDD.md` | How the whole repo works, including the parts you won't touch |
| `server/` | The runner, job queue and API (Node, TypeScript, SQLite) |
| `mock/` | The local model gateway. It replays the scenario, failures included |
| `apps/web/` | The web app (Vite + React) |
| `analysis/` | The contract your feature's computation follows, in TypeScript or Python |
| `tests/given/` | Tests that pass already |
| `tests/known-answer/` | One test per brief that fails until you build that feature |
| `lib/` | Code lifted from Weval Studio (see `lib/NOTICE.md`) |

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Mock (:4010), API and worker (:3000), web (:5173) |
| `npm test` | Every test |
| `npm run test:given` / `npm run test:known-answer` | One group |
| `npm run reset` | Delete the database; `npm run dev` starts a fresh run |
| `npm run typecheck` | TypeScript check |

The scenario contains realistic problems: flaky calls, messy data, and places where a
paper is less precise than it looks. Finding them is part of the job, and the rubric
rewards it.

`interviewer.sealed` is encrypted interviewer material. You don't need it, and it isn't
part of the exercise.
