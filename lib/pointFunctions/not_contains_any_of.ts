// Ported from weval-org/app src/point-functions/not_contains_any_of.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";
import { contains_any_of } from "./contains_any_of.ts";

/**
 * Negative variant of 'contains_any_of'.
 * Returns true if the response text does NOT contain ANY of the specified strings.
 * This is the negation of the 'contains_any_of' function.
 */
export const not_contains_any_of: PointFunction = (
  llmResponseText: string,
  args: any,
  context: PointFunctionContext,
): PointFunctionReturn => {
  const result = contains_any_of(llmResponseText, args, context);

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

  return { error: "Unexpected result type from contains_any_of function" };
};
