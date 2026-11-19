// CIP fork feature (see FORK.md): types for the deterministic point functions
// ported from weval. Weval passed its whole blueprint config in the context;
// the ported functions only ever read the conversation and the model id, so
// the context here carries just those.

export type PointFunctionMessage = {
  role: string;
  content: string | null;
};

export interface PointFunctionContext {
  /** Unused by the ported functions; kept so weval-shaped callers type-check. */
  config?: unknown;
  /** The conversation the response belongs to, including generated turns. */
  prompt?: { messages?: PointFunctionMessage[] };
  modelId: string;
  /** Indices of assistant messages that were generated (weval `assistant: null`). */
  generatedAssistantIndices?: number[];
}

/** Aliases used by the ported weval tests in place of weval's CLI config types. */
export type ComparisonConfig = unknown;
export type CliPromptConfig = { messages?: PointFunctionMessage[] };

export type AtLeastNOfArg = [number, string[]];
export type PointFunctionArgs =
  | string
  | number
  | boolean
  | null
  | (string | number | boolean)[]
  | AtLeastNOfArg
  | Record<string, unknown>;

export type PointFunctionReturn =
  | boolean
  | number
  | { error: string }
  | { score: boolean | number; explain?: string };

export type PointFunction = (
  llmResponseText: string,
  // Weval validates args inside each function, so they arrive untyped.
  args: unknown,
  context: PointFunctionContext,
) => PointFunctionReturn | Promise<PointFunctionReturn>;
