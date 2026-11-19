// Ported from weval-org/app src/point-functions/contains_word.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";
import { containsWord } from "./wordBoundary.ts";

/**
 * contains_word: Checks if the response contains a word with Unicode-aware word boundaries.
 *
 * Unlike standard \b word boundaries in JavaScript (which only work with ASCII [A-Za-z0-9_]),
 * this function uses Unicode property escapes to properly handle accented characters and
 * other Unicode letters.
 *
 * Examples:
 *   - "Paraná River" with arg "Paraná" -> true (handles accents correctly)
 *   - "São Paulo" with arg "São" -> true
 *   - "Hello world" with arg "Hello" -> true
 *   - "Hello world" with arg "ell" -> false (not a complete word)
 *
 * Word boundaries are defined as positions where:
 * - Before: start of string OR not a letter/number/underscore
 * - After: end of string OR not a letter/number/underscore
 *
 * This uses \p{L} (Unicode letters) and \p{N} (Unicode numbers) with the 'u' flag.
 */
export const contains_word: PointFunction = (
  llmResponseText: string,
  args: any,
  _context: PointFunctionContext,
): PointFunctionReturn => {
  if (typeof args !== "string") {
    return {
      error: "Invalid arguments for 'contains_word'. Expected a string.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  if (args.length === 0) {
    return true; // Empty string is vacuously present
  }

  return containsWord(llmResponseText, args, false);
};
