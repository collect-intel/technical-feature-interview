# Judge Panel Trust

> **Sandbox exercise.** Synthetic data only; nothing built here is used in a CIP product.
>
> **You won't finish this in the session, and you don't need to.** This is the whole feature; start
> with the test and get as far as you get.

**HMW** help blueprint authors trust a verdict when their judges disagree?

**Paper:** *Beyond Majority Voting: LLM Aggregation by Leveraging Higher-Order Information*
([arXiv 2510.01499](https://arxiv.org/abs/2510.01499), ICML 2026).

## Problem being solved

Every rubric check in a run is graded by a panel of judge models, and Mini Studio shows each
judge's verdict separately. When judges disagree, the author has no principled way to settle
the verdict: majority vote treats a weak judge and a strong one alike, and there's no answer
key to tell them apart.

## How it affects users

Illustrative for this exercise: a blueprint author comparing models sees a ✓ and a ✗ for the
same check and can't tell which to believe, so they either re-run with more judges (paying
more) or read every response themselves.

## Acceptance criteria

1. **`tests/known-answer/panel.test.ts` passes.** Start here.
2. A **Panel** view for a run (`/runs/:id/panel`) shows, for each rubric check, the aggregated
   verdict, with a switch between majority vote, Inverse Surprising Popularity (ISP) and
   Optimal Weight (OW, with accuracies estimated without labels: the paper covers this in §5.2).
3. It shows each judge's estimated reliability and weight, and flags any judge it doesn't
   trust, saying why.
4. It shows how many checks change verdict compared with majority vote.
5. The computation follows the analysis contract (`analysis/README.md`) and runs off the
   request path. A run that changes after the analysis was computed is shown as stale.
6. Incomplete runs and missing verdicts are handled visibly, not silently.

### `result_json` shape (required by the test)

```json
{
  "methods": {
    "majority": { "labels": { "<cell_id>|<criterion_id>": "met" } },
    "isp":      { "labels": { "<cell_id>|<criterion_id>": "unmet" } },
    "ow":       { "labels": { "<cell_id>|<criterion_id>": "met" } }
  }
}
```

Anything else you need for the view can sit alongside `methods`.

## Tests

- The known-answer test: the paper's own simulation (4 judges at accuracies 0.6–0.9, two
  options, 10,000 checks). ISP and OW must beat majority vote by at least 3 points.
- Add whatever tests you think the feature needs.

## Before and after

- **Before:** a grid of per-judge ✓/✗ with no aggregate.
- **After:** one trusted verdict per check, with the method stated, the judges' weights, and
  any judges that were flagged.
