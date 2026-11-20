# Convention Lab

> **Sandbox exercise.** Synthetic data only; nothing built here is used in a CIP product.

**HMW** let researchers watch how shared norms form in a population of AI agents?

**Paper:** Flint Ashery, Aiello & Baronchelli, *Emergent social conventions and collective
bias in LLM populations*, Science Advances 2025
([arXiv 2410.08948](https://arxiv.org/abs/2410.08948)).

## Problem being solved

The paper shows that populations of LLM agents playing a naming game settle on shared
conventions, that a collective bias can appear even when no single agent is biased, and that
a committed minority can tip an established convention. Researchers want to run these
experiments on their own agents without writing a simulator each time.

## How it affects users

Illustrative for this exercise: a researcher wants to know how large a committed minority
must be to flip a convention among their agents, and today it means a one-off script and
hours of runs with no record of the settings used.

## Acceptance criteria

1. **`tests/known-answer/lab.test.ts` passes.** Start here.
2. A **Lab** page (`/lab`) lets a researcher configure a simulation (names, population size,
   memory length, committed-minority share, number of seeds) and launch it as a background job.
3. Progress is shown while it runs; partial results are labelled as such.
4. Results show the convergence curve and, across seeds, which convention won and how
   often, with uncertainty.
5. Agents' moves come from the gateway's `/v1/agent` endpoint. Every simulation stores its
   settings and seed so it can be reproduced.

**Stretch goals** (only if you have time; we don't expect them in the session, but tell us how
you'd build them):

- Cancelling a running simulation, with cancelled results labelled.
- A sweep over committed-minority sizes that estimates the critical mass, with uncertainty.

### `result_json` shape (required by the test)

```json
{
  "runs": [
    { "seed": 1, "converged": true, "convention": "A" }
  ]
}
```

One entry per seed; `convention` is null when the population didn't converge. Anything else
you need for the view can sit alongside `runs`. Lab rows use the batch id as `run_id`.

## Tests

- The known-answer test: with two names and agents that have no preference of any kind, at
  least 80% of 30 populations must converge, and neither name may win more than 80% of them.
- Add whatever tests you think the feature needs.

## Before and after

- **Before:** no way to run the experiment.
- **After:** a page that runs it, shows it converging, and reports the critical mass with
  its uncertainty.
