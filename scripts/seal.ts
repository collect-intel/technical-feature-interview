// npm run seal: encrypt interviewer/ into interviewer.sealed (TDD §5.3).
// Adds the canary line to every text file first, and skips rewriting when nothing changed.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withCanary } from "../lib/canary.ts";
import { contentMac, encrypt, headerMac, sameMac } from "../lib/seal.ts";
import { interviewerKey } from "./lib/key.ts";
import { listSealedFiles, pack, SEALED_DIR, SEALED_FILE } from "./lib/bundle.ts";

if (!existsSync(SEALED_DIR)) {
  console.error(`Nothing to seal: ${SEALED_DIR}/ doesn't exist. Run \`npm run unseal\` first.`);
  process.exit(1);
}
const key = interviewerKey();
for (const rel of listSealedFiles()) {
  const p = join(SEALED_DIR, rel);
  const text = readFileSync(p, "utf8");
  const marked = withCanary(rel, text);
  if (marked !== text) writeFileSync(p, marked);
}
const plaintext = pack();
const mac = contentMac(plaintext, { key });
if (existsSync(SEALED_FILE) && sameMac(headerMac(readFileSync(SEALED_FILE)), mac)) {
  console.log(`${SEALED_FILE} is already up to date.`);
} else {
  writeFileSync(SEALED_FILE, encrypt(plaintext, { key }, mac));
  console.log(`Sealed ${listSealedFiles().length} files into ${SEALED_FILE}.`);
}
