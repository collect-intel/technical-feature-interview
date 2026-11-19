// Ported from weval-org/app src/point-functions/starts_with.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";

export const starts_with: PointFunction = (
  llmResponseText: string,
  args: any,
  _context: PointFunctionContext,
): PointFunctionReturn => {
  if (typeof args !== "string") {
    return {
      error: "Invalid arguments for 'starts_with'. Expected a string prefix.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  return llmResponseText.startsWith(args);
};
