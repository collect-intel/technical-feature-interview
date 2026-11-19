// Ported from weval-org/app src/point-functions/not_imatches.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";
import { imatches } from "./imatches.ts";

/**
 * Negative variant of 'imatches'.
 * Returns true if the response text does NOT match the specified regex pattern (case-insensitive).
 * This is the negation of the 'imatches' function.
 */
export const not_imatches: PointFunction = async (
  llmResponseText: string,
  args: any,
  context: PointFunctionContext,
): Promise<PointFunctionReturn> => {
  const result = await imatches(llmResponseText, args, context);

  // If the original function returned an error, pass it through
  if (typeof result === "object" && "error" in result) {
    return result;
  }

  // Invert the boolean result
  if (typeof result === "boolean") {
    return !result;
  }

  // Invert numeric scores (though imatches only returns boolean)
  if (typeof result === "number") {
    return 1.0 - result;
  }

  return { error: "Unexpected result type from imatches function" };
};
