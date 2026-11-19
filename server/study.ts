// Loads a scenario's survey study (people's answers at two points in time) into SQLite.
// Agents' answers are not loaded: they come from the gateway's /v1/survey endpoint.

import type { Scenario } from "../lib/scenario.ts";
import type { DB } from "./db.ts";

export function loadStudy(db: DB, scenario: Scenario): string | null {
  const study = scenario.study;
  if (!study) return null;
  if (db.prepare("SELECT 1 FROM studies WHERE id = ?").get(study.id)) return study.id;
  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO studies (id, title, conditions_json) VALUES (?, ?, ?)").run(study.id, study.title, JSON.stringify(study.conditions));
    const p = db.prepare("INSERT INTO study_participants (study_id, participant_id, groups_json) VALUES (?, ?, ?)");
    for (const x of study.participants) p.run(study.id, x.id, JSON.stringify(x.groups));
    const i = db.prepare("INSERT INTO study_items (study_id, item_id, text, kind, options_json) VALUES (?, ?, ?, ?, ?)");
    for (const x of study.items) i.run(study.id, x.id, x.text, x.kind, JSON.stringify(x.options));
    const a = db.prepare("INSERT INTO study_answers (study_id, participant_id, item_id, wave, answer) VALUES (?, ?, ?, ?, ?)");
    for (const [wave, answers] of [[1, study.answers.wave1], [2, study.answers.wave2]] as const) {
      for (const [key, answer] of Object.entries(answers)) {
        const [participantId, itemId] = key.split("|");
        a.run(study.id, participantId, itemId, wave, answer);
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return study.id;
}
