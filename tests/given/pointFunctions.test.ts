import assert from "node:assert/strict";
import { test } from "node:test";
import { pointFunctions } from "../../lib/pointFunctions/index.ts";

const ctx = { modelId: "test/model" };

test("lifted point functions behave as in Weval Studio", async () => {
  assert.equal(await pointFunctions.contains("Hello World", "World", ctx), true);
  assert.equal(await pointFunctions.contains("Hello World", "world", ctx), false);
  assert.equal(await pointFunctions.icontains("Hello World", "world", ctx), true);
  assert.equal(await pointFunctions.matches("Order 66", "\\d+", ctx), true);
  assert.equal(await pointFunctions.contains_word("São Paulo is large", "Paulo", ctx), true);
  assert.equal(Number(await pointFunctions.word_count_between("one two three", [1, 5], ctx)), 1);
});

test("the sandboxed $js function isn't part of this repo", () => {
  assert.equal(pointFunctions.js, undefined);
  assert.equal(pointFunctions.expr, undefined);
});
