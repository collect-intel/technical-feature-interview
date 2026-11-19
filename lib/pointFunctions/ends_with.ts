// Ported from weval-org/app src/point-functions/ends_with.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionContext,
  PointFunctionReturn,
} from "./types.ts";

export const ends_with: PointFunction = (
  llmResponseText: string,
  args: any,
  _context: PointFunctionContext,
): PointFunctionReturn => {
  if (typeof args !== "string") {
    return {
      error: "Invalid arguments for 'ends_with'. Expected a string suffix.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  return llmResponseText.endsWith(args);
};
