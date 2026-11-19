import assert from "node:assert/strict";
import { test } from "node:test";
import { decrypt, encrypt, newInterviewerKey, sessionCode, WrongSecretError } from "../../lib/seal.ts";
import { CANARY, withCanary } from "../../lib/canary.ts";

test("a scenario opens with its code, however it's typed", () => {
  const blob = encrypt(Buffer.from("scenario"), { code: "otter-maple-river" });
  assert.equal(decrypt(blob, { code: "Otter Maple  River" }).toString(), "scenario");
  assert.throws(() => decrypt(blob, { code: "otter-maple-lake" }), WrongSecretError);
});

test("the interviewer key is used verbatim", () => {
  const key = newInterviewerKey();
  const blob = encrypt(Buffer.from("sealed"), { key });
  assert.equal(decrypt(blob, { key }).toString(), "sealed");
  assert.throws(() => decrypt(blob, { key: key.toLowerCase() === key ? `${key}x` : key.toLowerCase() }), WrongSecretError);
});

test("session codes are derived: stable per scenario, different across scenarios and rounds", () => {
  const key = newInterviewerKey();
  const a = sessionCode(key, "2026-12", "s1");
  assert.equal(a, sessionCode(key, "2026-12", "s1"));
  assert.notEqual(a, sessionCode(key, "2026-12", "s2"));
  assert.notEqual(a, sessionCode(key, "2027-01", "s1"));
  assert.equal(a.split("-").length, 6);
});

test("sealed files get a canary line in a comment their format allows", () => {
  assert.ok(withCanary("notes.md", "# Notes").startsWith("<!--"));
  assert.ok(withCanary("gen.ts", "export {}").startsWith("//"));
  assert.ok(withCanary("x.yaml", "a: 1").includes(CANARY));
  assert.equal(withCanary("data.json", "{}"), "{}");
});
