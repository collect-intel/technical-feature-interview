// Interview fork of Weval Studio's js.ts (see ./NOTICE.md). Studio runs blueprint
// regexes inside a QuickJS sandbox because authors are untrusted; here every
// blueprint ships with the repo, so patterns run on the native RegExp engine.
// The `$js` / `expr` point function is not included.

export type RegexOutcome =
  | { ok: true; match: string | null }
  | { ok: false; message: string };

/** Each pattern's first match in `text`, or why it could not run. */
export async function regexMatch(
  text: string,
  patterns: { source: string; flags: string }[],
): Promise<RegexOutcome[]> {
  return patterns.map(({ source, flags }) => {
    try {
      const m = new RegExp(source, flags).exec(text);
      return { ok: true as const, match: m ? m[0] : null };
    } catch (e) {
      return { ok: false as const, message: (e as Error).message };
    }
  });
}
