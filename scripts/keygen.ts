// npm run keygen: print a new interviewer key. Store it in the team password manager and as the
// INTERVIEWER_KEY repository secret. To rotate: unseal with the old key, then seal with the new one.
import { newInterviewerKey } from "../lib/seal.ts";
console.log(newInterviewerKey());
