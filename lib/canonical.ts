import { createHash } from "node:crypto";

/** JSON with object keys sorted at every level, so equal values hash equally. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export function sha256(text: string | Buffer): string {
  return createHash("sha256").update(text).digest("hex");
}

/** A short deterministic id from its parts. */
export function stableId(...parts: (string | number)[]): string {
  return sha256(parts.join("\u0000")).slice(0, 16);
}
