# Technical Feature Interview

## What this is

At CIP, research on collective intelligence and AI evaluation keeps turning into product: a
method from a paper becomes a page in Weval Studio that someone relies on. This interview is
that job in miniature. You read one short paper, then start building a feature from it in a
small app called **Mini Studio**, with whatever AI tools you normally use.

It's a one-hour live session, not a take-home. **We don't expect you to finish.** We want to
see how you work: how you read the paper, how you use and check your AI tools, and how you
reason when something doesn't add up.

> **This is a sandbox.** All data is synthetic, nothing calls a real model, and nothing you
> build here is used in any CIP product.

## AI: use it the way you work

We expect you to use AI. Most of our engineering runs through tools like Claude, so we want
to see you work with them the way you would on the job.

What we watch is judgement:

- Did you check the AI's plan against the paper, and catch where they differ?
- Can you explain the code you kept?
- When something breaks, do you reason about it or keep re-prompting?

Use NotebookLM, Elicit, Claude, Cursor or anything else. You don't need to label which lines
came from where. Tell us which tools you used and share your screen while you work.

## What we're looking for

We score six things, each from 1 to 4, from what we see you do. The last three depend on how
far you get, so we only score them if we see them; nobody is marked down for not reaching
them. The full rubric is in [docs/RUBRIC.md](docs/RUBRIC.md).

1. **Research faithfulness**: you build the method the paper actually describes, and you
   notice where it's vague.
2. **Evaluation first**: you start from the known-answer test and use it to drive the
   computation.
3. **System design**: the computation runs off the request path and its results can be traced
   back to their settings.
4. **Product**: the feature works for the person in the brief, including when data is missing
   or a run is incomplete.
5. **Honest output**: uncertainty, exclusions and partial results reach the screen.
6. **AI use**: you check what the AI gives you and can defend what you kept.

## Getting started

You need [Node.js](https://nodejs.org) 22.18 or newer. Nothing else: no Docker, no API keys,
no database to install.

```bash
git clone https://github.com/collect-intel/technical-feature-interview
cd technical-feature-interview
npm install
npm run dev
```

Open http://localhost:3000. A practice evaluation runs on its own and finishes in a few
seconds. Click into it to see each model's response and the judges' verdicts.

If anything goes wrong, run `npm run doctor` and send us what it prints.

## The challenge

Mini Studio runs evaluations: it sends prompts to models, has judge models grade the answers,
and stores everything in a local database. We built it from Weval Studio's own runner, cut down
so it boots in seconds, and that part already works. Your job is to add one feature on top of
it, based on a paper.

You work on one paper. We'll tell you which brief is yours. Each brief is a short ticket with the user, the problem
and the acceptance criteria.

| Brief | Paper | You build |
|---|---|---|
| [Judge Panel Trust](briefs/judge-panel-trust.md) | Beyond Majority Voting (2025) | A way to settle verdicts when judges disagree |
| [Model Monoculture](briefs/model-monoculture.md) | Doshi & Hauser (2024) | A measure of whether models converge on the same answer |
| [Convention Lab](briefs/convention-lab.md) | Flint Ashery, Aiello & Baronchelli (2025) | A small lab for watching AI agents settle on shared norms |
| [Agent Fidelity](briefs/agent-fidelity.md) | Park et al. (2024) | A check on how faithfully each person's AI agent answers as they would |

### How to approach it

1. **Start with the test.** Each brief has a test in `tests/known-answer/` that fails until
   the feature exists. Work towards it before anything else.
2. **Follow the paper.** Where it's vague, make a choice and say it out loud. If you get to
   writing results, record the choice in the result itself (see
   [analysis/README.md](analysis/README.md)).
3. **Follow the analysis contract** in [analysis/README.md](analysis/README.md). You can write
   the computation in TypeScript or Python.
4. **The page comes last.** The brief describes it, but you probably won't reach it, and
   that's fine. Tell us what it would need to show.

### On scale

The data in the practice scenario is small. Assume it could be 10 to 100 times larger. At the
end we'll ask how you'd handle a change in requirements.

### The scenario isn't clean

Your session's scenario contains realistic problems: calls that fail, data that's messier than
it looks, and places where the paper is less precise than it seems. Finding them is part of
the job, and the rubric rewards it.

## The session

| Before (about 30 minutes, your time) | Skim your paper. Run the app and `npm run doctor`. Read your brief. |
|---|---|
| **5 minutes** | Load the scenario file we send you, and share your screen. |
| **10 minutes** | Tell us what the paper's method does and one thing it leaves unspecified. |
| **35 minutes** | Work on the feature with your AI tools, thinking aloud. We'll ask a couple of questions along the way. |
| **10 minutes** | What you'd do next, how you'd handle a change we describe, and one piece of AI-written code you kept and why it's correct. |

At the start, your interviewer will send you a scenario file. Stop the app, then run:

```bash
npm run scenario -- path/to/the-file.json
npm run dev
```

## What to hand in

Nothing. The work happens on screen. If you'd like us to look at what you had at the end,
push it to a private copy of this repository and invite your interviewer.

## Useful commands

| Command | Does |
|---|---|
| `npm run dev` | Runs the app at http://localhost:3000 |
| `npm test` | Runs every test. The known-answer tests fail until you build a feature |
| `npm run test:known-answer` | Runs only the known-answer tests |
| `node --test tests/known-answer/panel.test.ts` | Runs one brief's test (swap in yours) |
| `npm run reset` | Clears the database. Restart `npm run dev` for a fresh run |
| `npm run doctor` | Checks your setup |

## Other things in the repo

- The repository is explained in full in [docs/TDD.md](docs/TDD.md), including parts you
  won't touch.
- Some code in `lib/` comes from Weval Studio; see [lib/NOTICE.md](lib/NOTICE.md).

Questions before your session, or something won't boot? Reply to your interviewer's email and we'll sort it out before the day.
