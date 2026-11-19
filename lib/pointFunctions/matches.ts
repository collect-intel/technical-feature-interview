// Ported from weval-org/app src/point-functions/matches.ts (MIT, see ./NOTICE.md).
// The pattern is an author's, so it runs in the sandbox (see regexMatch).
import { regexMatch } from "./js.ts";
import type { PointFunction } from "./types.ts";

export const matches: PointFunction = async (llmResponseText, args) => {
  if (typeof args !== "string") {
    return {
      error: "Invalid arguments for 'matches'. Expected a regex string.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  const [result] = await regexMatch(llmResponseText, [
    { source: args, flags: "" },
  ]);
  if (!result || !result.ok) {
    return {
      error: `Invalid regex pattern for 'matches': ${result?.message ?? "no result"}`,
    };
  }
  return result.match !== null;
};
