# The analysis contract

A feature's computation is a command that reads the database and writes one row to the
`analyses` table (TDD §4.6). Write it in TypeScript or Python; the tests don't care which.

`analysis/commands.json` maps each method to the command that runs it. The defaults point at
TypeScript files under `server/analysis/`, which don't exist until you write them. To use
Python instead, point the method at `["python3", "-m", "analysis", "<method>"]` and implement it
in this folder (standard library `sqlite3` only, no installs).

## How a command is called

```
<command...> <id>
```

| Env var | Meaning |
|---|---|
| `DB_PATH` | The SQLite file to read and write |
| `MOCK_URL` | The model gateway, if the method needs to call it (embeddings, agents) |
| `LAB_PARAMS` | Lab only: the simulation parameters as JSON |

`<id>` is the run id (`panel`, `diversity`) or a batch id that groups simulations (`lab`).
Exit 0 on success. Anything on stderr is shown when a test fails.

## What the row must contain

| Column | Contents |
|---|---|
| `run_id` | The id you were called with |
| `method` | `panel`, `diversity` or `lab` |
| `method_version` | Your version string; change it when the computation changes |
| `params_json` | The settings the method ran with |
| `interpretations_json` | Every choice you made where the paper is ambiguous, as data |
| `input_hash` | A hash of the input rows, so a changed run can be detected as `stale` |
| `status` | `partial` if the run wasn't complete, otherwise `final` |
| `result_json` | The result. Its required shape is in each brief's acceptance criteria |
