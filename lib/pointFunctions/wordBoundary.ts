// CIP fork feature (see FORK.md): Unicode word-boundary search for the
// contains_word family, without building a regex from the author's word.
// A word counts when the code points either side of it are not letters,
// numbers or underscores, as weval's (?<![\p{L}\p{N}_])…(?![\p{L}\p{N}_]).

const WORD_CHAR = /^[\p{L}\p{N}_]$/u;

function codePointBefore(text: string, index: number): string {
  if (index <= 0) return "";
  const low = text.charCodeAt(index - 1);
  if (index >= 2 && low >= 0xdc00 && low <= 0xdfff) {
    const high = text.charCodeAt(index - 2);
    if (high >= 0xd800 && high <= 0xdbff) return text.slice(index - 2, index);
  }
  return text.slice(index - 1, index);
}

function codePointAt(text: string, index: number): string {
  const cp = text.codePointAt(index);
  return cp === undefined ? "" : String.fromCodePoint(cp);
}

/** Whether `word` occurs in `text` as a whole word. */
export function containsWord(
  text: string,
  word: string,
  caseInsensitive: boolean,
): boolean {
  if (word.length === 0) return true;
  const haystack = caseInsensitive ? text.toLowerCase() : text;
  const needle = caseInsensitive ? word.toLowerCase() : word;
  // Lower-casing can change a string's length ("İ"), which would shift
  // positions; compare position by position on the original then.
  const aligned = haystack.length === text.length;
  for (let i = 0; i + word.length <= text.length; i++) {
    const hit = aligned
      ? haystack.startsWith(needle, i)
      : text.slice(i, i + word.length).toLowerCase() === needle;
    if (!hit) continue;
    const before = codePointBefore(text, i);
    const after = codePointAt(text, i + word.length);
    if (!WORD_CHAR.test(before) && !WORD_CHAR.test(after)) return true;
  }
  return false;
}
