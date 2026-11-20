# How the session is scored

Six dimensions, each scored 1–4, from what we see you do in a one-hour session. There's no
single total: the hiring decision reads the whole profile. We don't expect you to finish, so
the last three (**System design**, **Product**, **Honest output**) are scored only if we see
them, in what you build or in how you say you'd build it. Nobody is marked down for not
reaching them.

| Dimension | Mid-level bar | Below bar | Senior signal |
|---|---|---|---|
| **Research faithfulness** | Implements the paper's method correctly; catches where the AI plan departs from the paper; records a decision wherever the paper is ambiguous | Builds whatever the plan says | Questions whether the method fits this data |
| **Evaluation first** | Starts from the known-answer test and uses it to drive the computation; checks one result by hand | Starts with the page, or never runs the test | Adds a test of their own that exposes a problem in the data |
| **System design** | Sensible data model; computation off the request path; results versioned and re-runnable | Computes on every request; results can't be traced to their settings | Designs for the next feature as well as this one |
| **Product** | Works end to end for the user in the brief; empty, partial and error states handled | Happy path only | Pushes back on the brief with a better user outcome |
| **Honest output** | Intervals, exclusions and partial-run flags reach the screen | A bare number shown as fact | Explains the result's limits without being asked |
| **AI use** | Checks the output; can explain the AI-written code they kept | Accepts AI output wholesale | Uses the AI to explore alternatives quickly |

## The session

| Stage | Time |
|---|---|
| Load the scenario, share your screen | 5 min |
| Say what the paper's method does and what it leaves unspecified | 10 min |
| Work on the feature with your AI tools, thinking aloud | 35 min |
| What you'd do next, a change of requirements to talk through, and one piece of AI-written code you kept and why it's correct | 10 min |

Use whatever AI tools you normally use, and share your screen throughout.
