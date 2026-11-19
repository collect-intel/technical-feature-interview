// Ported from weval-org/app src/point-functions/iends_with.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionContext,
  PointFunctionReturn,
} from "./types.ts";

export const iends_with: PointFunction = (
  llmResponseText: string,
  args: any,
  _context: PointFunctionContext,
): PointFunctionReturn => {
  if (typeof args !== "string") {
    return {
      error: "Invalid arguments for 'iends_with'. Expected a string suffix.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  return llmResponseText.toLowerCase().endsWith(args.toLowerCase());
};
