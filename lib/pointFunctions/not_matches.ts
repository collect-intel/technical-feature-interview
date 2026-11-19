// Ported from weval-org/app src/point-functions/not_matches.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";
import { matches } from "./matches.ts";

/**
 * Negative variant of 'matches'.
 * Returns true if the response text does NOT match the specified regex pattern.
 * This is the negation of the 'matches' function.
 */
export const not_matches: PointFunction = async (
  llmResponseText: string,
  args: any,
  context: PointFunctionContext,
): Promise<PointFunctionReturn> => {
  const result = await matches(llmResponseText, args, context);

  // If the original function returned an error, pass it through
  if (typeof result === "object" && "error" in result) {
    return result;
  }

  // Invert the boolean result
  if (typeof result === "boolean") {
    return !result;
  }

  // Invert numeric scores (though matches only returns boolean)
  if (typeof result === "number") {
    return 1.0 - result;
  }

  return { error: "Unexpected result type from matches function" };
};
