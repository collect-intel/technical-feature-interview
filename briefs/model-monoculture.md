# Model Monoculture

> **Sandbox exercise.** Synthetic data only; nothing built here is used in a CIP product.
>
> **You won't finish this in the session, and you don't need to.** This is the whole feature; start
> with the test and get as far as you get.

**HMW** show blueprint authors when models converge on the same answer?

**Paper:** Doshi & Hauser, *Generative AI enhances individual creativity but reduces the
collective diversity of novel content*, Science Advances 2024
([PMC11244532](https://pmc.ncbi.nlm.nih.gov/articles/PMC11244532)).

## Problem being solved

Runs score each response on its own. Nothing shows whether the responses, taken together,
have become alike: whether a shared system prompt or example answer pushes every model
toward the same answer. The paper measures this for human writers; this feature measures it
for model responses.

## How it affects users

Illustrative for this exercise: an author adds an example answer to a blueprint's system
prompt, sees quality scores rise, and can't see that every model now gives near-identical
answers.

## Acceptance criteria

1. **`tests/known-answer/diversity.test.ts` passes.** Start here.
2. A **Diversity** view for a run (`/runs/:id/diversity`) shows the paper's collective
   similarity score by condition (a target's `condition` in the run manifest), with an
   interval, and lets the author drill down to the most typical responses.
3. Embeddings come from the gateway's `/v1/embed` endpoint and are never requested twice for
   the same content.
4. The computation follows the analysis contract (`analysis/README.md`) and runs off the
   request path, with progress shown while it runs.
5. Quality and diversity are shown side by side, not merged into one number.
6. Incomplete runs are handled visibly.

### `result_json` shape (required by the test)

```json
{
  "scores": [
    { "cell_id": "…", "condition": "A", "score": 97.3 }
  ]
}
```

`score` is the paper's collective similarity on a 0–100 scale. Anything else you need for
the view can sit alongside `scores`.

## Tests

- The known-answer test: five identical responses must score 100; 200 random ones must
  average about 0.
- Add whatever tests you think the feature needs.

## Before and after

- **Before:** per-response scores only.
- **After:** a view showing how alike each condition's responses are, with uncertainty, and
  examples of the most typical responses.
