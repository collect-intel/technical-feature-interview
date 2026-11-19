// Ported from weval-org/app src/point-functions/is_json.ts (MIT, see ./NOTICE.md).
import type { PointFunction } from "./types.ts";

export const is_json: PointFunction = (llmResponseText: string) => {
  if (typeof llmResponseText !== "string") {
    // This case should ideally not be hit if called from the evaluator, but good practice.
    return false;
  }
  try {
    const parsed = JSON.parse(llmResponseText);
    // Ensure what was parsed is an object or array, not just a string literal like '"hello"'
    return typeof parsed === "object" && parsed !== null;
  } catch (_e) {
    return false;
  }
};
