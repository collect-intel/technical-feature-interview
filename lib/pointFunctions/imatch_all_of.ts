// Ported from weval-org/app src/point-functions/imatch_all_of.ts (MIT, see ./NOTICE.md).
// The patterns are an author's, so they run in the sandbox (see regexMatch).
import { regexMatch } from "./js.ts";
import type { PointFunction } from "./types.ts";

export const imatch_all_of: PointFunction = async (llmResponseText, args) => {
  if (!Array.isArray(args) || !args.every((item) => typeof item === "string")) {
    return {
      error:
        "Invalid arguments for 'imatch_all_of'. Expected an array of regex strings.",
    };
  }
  if (args.length === 0) {
    return 1.0; // Vacuously true
  }
  const results = await regexMatch(
    String(llmResponseText),
    (args as string[]).map((source) => ({ source, flags: "i" })),
  );
  let foundCount = 0;
  for (const result of results) {
    if (!result.ok) {
      return {
        error: `Invalid regex pattern in 'imatch_all_of': ${result.message}`,
      };
    }
    if (result.match !== null) foundCount++;
  }
  return foundCount / args.length;
};
