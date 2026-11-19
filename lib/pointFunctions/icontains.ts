// Ported from weval-org/app src/point-functions/icontains.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";

export const icontains: PointFunction = (
  llmResponseText: string,
  args: any,
  _context: PointFunctionContext,
): PointFunctionReturn => {
  if (typeof args !== "string") {
    return { error: "Invalid arguments for 'icontains'. Expected a string." };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }
  return llmResponseText.toLowerCase().includes(args.toLowerCase());
};
