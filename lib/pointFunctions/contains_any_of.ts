// Ported from weval-org/app src/point-functions/contains_any_of.ts (MIT, see ./NOTICE.md).
import type {
  PointFunction,
  PointFunctionReturn,
  PointFunctionContext,
} from "./types.ts";

export const contains_any_of: PointFunction = (
  llmResponseText: string,
  args: any,
  _context: PointFunctionContext,
): PointFunctionReturn => {
  if (!Array.isArray(args) || !args.every((item) => typeof item === "string")) {
    return {
      error:
        "Invalid arguments for 'contains_any_of'. Expected an array of strings.",
    };
  }
  if (typeof llmResponseText !== "string") {
    return false;
  }

  for (const substring of args) {
    if (llmResponseText.includes(substring)) {
      return true;
    }
  }

  return false;
};
