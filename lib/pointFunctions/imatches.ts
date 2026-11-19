// Ported from weval-org/app src/point-functions/imatches.ts (MIT, see ./NOTICE.md).
// The pattern is an author's, so it runs in the sandbox (see regexMatch).
import { regexMatch } from "./js.ts";
import type { PointFunction } from "./types.ts";

export const imatches: PointFunction = async (llmResponseText, args) => {
  if (typeof args !== "string") {
    return {
      error: "Invalid arguments for 'imatches'. Expected a regex string.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  const [result] = await regexMatch(llmResponseText, [
    { source: args, flags: "i" },
  ]);
  if (!result || !result.ok) {
    return {
      error: `Invalid regex pattern for 'imatches': ${result?.message ?? "no result"}`,
    };
  }
  return result.match !== null;
};
