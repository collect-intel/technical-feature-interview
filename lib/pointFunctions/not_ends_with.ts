// Ported from weval-org/app src/point-functions/not_ends_with.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";
import { ends_with } from "./ends_with.ts";

/**
 * Negative variant of 'ends_with'.
 * Returns true if the response text does NOT end with the specified string.
 * This is the negation of the 'ends_with' function.
 */
export const not_ends_with: PointFunction = (
  llmResponseText: string,
  args: any,
  context: PointFunctionContext,
): PointFunctionReturn => {
  const result = ends_with(llmResponseText, args, context);

  // If the original function returned an error, pass it through
  if (typeof result === "object" && "error" in result) {
    return result;
  }

  // Invert the boolean result
  if (typeof result === "boolean") {
    return !result;
  }

  // Invert numeric scores
  if (typeof result === "number") {
    return 1.0 - result;
  }

  return { error: "Unexpected result type from ends_with function" };
};
