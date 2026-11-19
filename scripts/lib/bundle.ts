// Packs interviewer/ into one buffer and back (TDD §5.3). One bundle, so file names stay sealed too.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

export const SEALED_DIR = "interviewer";
export const SEALED_FILE = "interviewer.sealed";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function listSealedFiles(): string[] {
  return walk(SEALED_DIR)
    .map((p) => relative(SEALED_DIR, p).split(sep).join("/"))
    .sort();
}

export function pack(): Buffer {
  const files: Record<string, string> = {};
  for (const rel of listSealedFiles()) files[rel] = readFileSync(join(SEALED_DIR, rel)).toString("base64");
  // mtime-free, sorted: the same content always packs to the same bytes.
  return gzipSync(Buffer.from(JSON.stringify({ version: 1, files })), { level: 9 });
}

export function unpack(buf: Buffer): string[] {
  const { files } = JSON.parse(gunzipSync(buf).toString("utf8")) as { files: Record<string, string> };
  for (const [rel, b64] of Object.entries(files)) {
    const out = join(SEALED_DIR, ...rel.split("/"));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(b64, "base64"));
  }
  return Object.keys(files);
}
