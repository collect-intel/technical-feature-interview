// Every text file inside the sealed zone starts with a canary line (TDD §5.4). The pre-commit
// hook and CI refuse any tracked file that contains it, so sealed content can't be committed
// in plain text by accident. The token is assembled here rather than written out, so this
// file doesn't trip its own check.

export const CANARY = ["RFI", "SEALED", "CONTENT"].join("-");

const COMMENT: Record<string, (line: string) => string> = {
  md: (l) => `<!-- ${l} -->`,
  ts: (l) => `// ${l}`,
  js: (l) => `// ${l}`,
  yaml: (l) => `# ${l}`,
  yml: (l) => `# ${l}`,
  py: (l) => `# ${l}`,
  json: () => "",
  csv: () => "",
};

const LINE = `${CANARY}: sealed interviewer material. Never commit outside interviewer.sealed.`;

/** The file's text with the canary as its first line, if the format allows a comment. */
export function withCanary(path: string, text: string): string {
  if (text.includes(CANARY)) return text;
  const ext = path.split(".").pop() ?? "";
  const make = COMMENT[ext];
  if (!make) return text;
  const line = make(LINE);
  return line ? `${line}\n${text}` : text;
}
