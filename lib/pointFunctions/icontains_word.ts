// Ported from weval-org/app src/point-functions/icontains_word.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";
import { containsWord } from "./wordBoundary.ts";

/**
 * icontains_word: Case-insensitive version of contains_word.
 *
 * Checks if the response contains a word with Unicode-aware word boundaries,
 * ignoring case differences.
 *
 * Examples:
 *   - "Paraná River" with arg "paraná" -> true (case-insensitive + accents)
 *   - "São Paulo" with arg "SÃO" -> true
 *   - "HELLO world" with arg "hello" -> true
 *   - "Hello world" with arg "ell" -> false (not a complete word)
 */
export const icontains_word: PointFunction = (
  llmResponseText: string,
  args: any,
  _context: PointFunctionContext,
): PointFunctionReturn => {
  if (typeof args !== "string") {
    return {
      error: "Invalid arguments for 'icontains_word'. Expected a string.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  if (args.length === 0) {
    return true; // Empty string is vacuously present
  }

  return containsWord(llmResponseText, args, true);
};
