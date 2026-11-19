// Ported from weval-org/app src/point-functions/imatch_at_least_n_of.ts (MIT, see ./NOTICE.md).
// The patterns are an author's, so they run in the sandbox (see regexMatch).
import { regexMatch } from "./js.ts";
import type { PointFunction } from "./types.ts";

export const imatch_at_least_n_of: PointFunction = async (
  llmResponseText,
  args,
) => {
  if (
    !Array.isArray(args) ||
    args.length !== 2 ||
    typeof args[0] !== "number" ||
    !Array.isArray(args[1]) ||
    !args[1].every((item) => typeof item === "string")
  ) {
    return {
      error:
        "Invalid arguments for 'imatch_at_least_n_of'. Expected an array of the format [n, ['pattern1', 'pattern2', ...]].",
    };
  }

  const n = args[0];
  const patterns = args[1] as string[];

  if (n <= 0) {
    return 1.0; // Requirement of 0 or fewer is always met.
  }
  if (patterns.length === 0) {
    return 0.0;
  }

  const results = await regexMatch(
    String(llmResponseText),
    patterns.map((source) => ({ source, flags: "i" })),
  );
  let foundCount = 0;
  for (const result of results) {
    if (!result.ok) {
      return {
        error: `Invalid regex pattern in 'imatch_at_least_n_of': ${result.message}`,
      };
    }
    if (result.match !== null) foundCount++;
  }
  return Math.min(1.0, foundCount / n);
};
