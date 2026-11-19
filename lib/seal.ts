// Encryption for the two sealed artefacts (TDD §5):
//   - scenarios/<id>.enc   opened by a 6-word session code read out at the start of a session
//   - interviewer.sealed   opened by the interviewer key (password manager / CI secret)
// Everything is node:crypto: AES-256-GCM, scrypt for passphrases, HKDF for session codes.

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { WORDS } from "./wordlist.ts";

const MAGIC = Buffer.from("RFI1");
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Lowercase words joined by hyphens, whatever separators were typed or spoken. */
export function normalizeSecret(secret: string): string {
  return secret
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9_-]+|[-_]+/)
    .filter(Boolean)
    .join("-");
}

/**
 * A secret is either a session code (spoken words: normalized, so case and separators don't
 * matter) or the interviewer key (base64url: used verbatim, so no entropy is lost).
 */
export type Secret = { code: string } | { key: string };

function secretText(secret: Secret): string {
  return "code" in secret ? normalizeSecret(secret.code) : secret.key.trim();
}

function deriveKey(secret: Secret, salt: Buffer): Buffer {
  return scryptSync(secretText(secret), salt, 32, SCRYPT);
}

/** Header layout: MAGIC(4) | MAC(32) | salt(16) | iv(12) | tag(16) | ciphertext. */
export function encrypt(plaintext: Buffer, secret: Secret, mac: Buffer = Buffer.alloc(32)): Buffer {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret, salt), iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([MAGIC, mac, salt, iv, cipher.getAuthTag(), ct]);
}

export class WrongSecretError extends Error {
  constructor() {
    super("That code or key does not open this file.");
  }
}

export function decrypt(blob: Buffer, secret: Secret): Buffer {
  if (blob.length < 80 || !blob.subarray(0, 4).equals(MAGIC)) {
    throw new Error("Not a sealed file (bad header).");
  }
  const salt = blob.subarray(36, 52);
  const iv = blob.subarray(52, 64);
  const tag = blob.subarray(64, 80);
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret, salt), iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(blob.subarray(80)), decipher.final()]);
  } catch {
    throw new WrongSecretError();
  }
}

/** The MAC stored in a sealed file's header, so `seal` can skip rewriting unchanged content. */
export function headerMac(blob: Buffer): Buffer {
  return blob.subarray(4, 36);
}

/** HMAC of the plaintext under a key derived from the secret. Reveals only equality. */
export function contentMac(plaintext: Buffer, secret: Secret): Buffer {
  const macKey = scryptSync(secretText(secret), "rfi-content-mac", 32, SCRYPT);
  return createHmac("sha256", macKey).update(plaintext).digest();
}

export function sameMac(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A fresh interviewer key: 32 random bytes, base64url. */
export function newInterviewerKey(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * A scenario's session code: 6 words derived from the interviewer key, the round and the
 * scenario id. Derived, never stored, so `npm run codes` can always regenerate the sheet.
 */
export function sessionCode(interviewerKey: string, round: string, scenarioId: string): string {
  const bytes = Buffer.from(
    hkdfSync("sha256", interviewerKey.trim(), `rfi-round:${round}`, `rfi-scenario:${scenarioId}`, 6),
  );
  return [...bytes].map((b) => WORDS[b]).join("-");
}
