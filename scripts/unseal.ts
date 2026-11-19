// npm run unseal: decrypt interviewer.sealed into interviewer/ (git-ignored).
// Refuses to overwrite unsealed edits unless --force.
import { existsSync, readFileSync, rmSync } from "node:fs";
import { contentMac, decrypt, headerMac, sameMac } from "../lib/seal.ts";
import { interviewerKey } from "./lib/key.ts";
import { pack, SEALED_DIR, SEALED_FILE, unpack } from "./lib/bundle.ts";

const key = interviewerKey();
const blob = readFileSync(SEALED_FILE);
if (existsSync(SEALED_DIR) && !process.argv.includes("--force")) {
  if (!sameMac(contentMac(pack(), { key }), headerMac(blob))) {
    console.error(`${SEALED_DIR}/ has changes that aren't sealed. Run \`npm run seal\` first, or pass --force to discard them.`);
    process.exit(1);
  }
}
const plaintext = decrypt(blob, { key });
rmSync(SEALED_DIR, { recursive: true, force: true });
console.log(`Unsealed ${unpack(plaintext).length} files into ${SEALED_DIR}/ (git-ignored).`);
