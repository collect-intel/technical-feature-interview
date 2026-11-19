# Agent Fidelity

> **Sandbox exercise.** Synthetic data only; nothing built here is used in a CIP product.

**HMW** show researchers how faithfully each participant's AI agent answers as that person would?

**Paper:** Park et al., *Generative Agent Simulations of 1,000 People* (2024),
[arXiv 2411.10109v1](https://arxiv.org/abs/2411.10109v1). Use v1: later versions of that arXiv
entry are a substantially different paper.

## Problem being solved

Studies increasingly build an AI agent for each participant, from an interview or from
demographics, and use the agents to answer new questions. Researchers need to know how far to
trust them: how well each agent reproduces its person's answers, relative to how consistent the
person is with themselves, and whether agents serve some groups worse than others.

## How it affects users

Illustrative for this exercise: a researcher about to run a follow-up survey on agents instead
of people can't tell whether the agents are good enough, or good enough for everyone.

## Acceptance criteria

1. **`tests/known-answer/fidelity.test.ts` passes.** Start here.
2. An **Agents** page (`/agents`) shows, for each agent condition in the study (for example
   `interview` and `demographic`), the paper's normalized accuracy across participants, with
   an interval, and how it breaks down by group.
3. It shows the gap between the best- and worst-served groups (the paper's Demographic Parity
   Difference) for each grouping, with enough context to judge whether the gap is real.
4. Agents' answers come from the gateway's `/v1/survey` endpoint and are never requested
   twice for the same (condition, participant, item).
5. The computation follows the analysis contract (`analysis/README.md`) and runs off the
   request path, with progress shown while agents' answers are being collected.
6. Missing answers, from people or agents, are handled visibly and consistently.

### `result_json` shape (required by the test)

```json
{
  "conditions": {
    "interview": {
      "participants": [
        { "participant_id": "p0001", "accuracy": 0.7, "consistency": 0.8, "normalized_accuracy": 0.875 }
      ]
    }
  }
}
```

`accuracy` compares the agent with the person's first answers; `consistency` compares the
person's second answers with their first. Anything else you need for the view can sit
alongside `participants`. Analyses rows use the study id as `run_id`.

## Tests

- The known-answer test: an agent that gives each person's second-wave answers must score a
  normalized accuracy of exactly 1.0, and one that gives their first-wave answers must be 100%
  accurate.
- Add whatever tests you think the feature needs.

## Before and after

- **Before:** no way to tell how well participants' agents represent them.
- **After:** a page showing how faithful each kind of agent is, for whom, and how sure we are.
