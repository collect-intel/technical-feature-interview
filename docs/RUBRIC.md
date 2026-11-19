# How the session is scored

Six dimensions, each scored 1–4. There's no single total: the hiring decision reads the
whole profile. Your interviewer also has per-paper examples of each level.

| Dimension | Mid-level bar | Below bar | Senior signal |
|---|---|---|---|
| **Research faithfulness** | Implements the paper's method correctly; catches where the AI plan departs from the paper; records a decision wherever the paper is ambiguous | Builds whatever the plan says | Questions whether the method fits this data |
| **Evaluation first** | Gets the known-answer test passing *before* building the main logic | Tests at the end, or never | Adds a test of their own that exposes a problem in the data |
| **System design** | Sensible data model; computation off the request path; results versioned and re-runnable | Computes on every request; results can't be traced to their settings | Designs for the next feature as well as this one |
| **Product** | Works end to end for the user in the brief; empty, partial and error states handled | Happy path only | Pushes back on the brief with a better user outcome |
| **Honest output** | Intervals, exclusions and partial-run flags reach the screen | A bare number shown as fact | Explains the result's limits without being asked |
| **AI use** | Checks the output; can explain the AI-written code they kept | Accepts AI output wholesale | Uses the AI to explore alternatives quickly |

## The session

| Stage | Time |
|---|---|
| Read the brief; say what the paper leaves unspecified | 10 min |
| Plan with your AI tools; show where the plan departs from the paper | 15 min |
| Design review: data model, where the computation runs, API shape | 15 min |
| Build (one change of requirements partway through) | 65 min |
| Demo, a short note on your deviations from the paper, and one piece of AI-written code you kept and why it's correct | 15 min |

Use whatever AI tools you normally use, and share your screen throughout.
