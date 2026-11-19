// Ported from weval-org/app src/point-functions/istarts_with.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";

export const istarts_with: PointFunction = (
  llmResponseText: string,
  args: any,
  _context: PointFunctionContext,
): PointFunctionReturn => {
  if (typeof args !== "string") {
    return {
      error: "Invalid arguments for 'istarts_with'. Expected a string prefix.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  return llmResponseText.toLowerCase().startsWith(args.toLowerCase());
};
