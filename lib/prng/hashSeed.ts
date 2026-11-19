// Lifted from Weval Studio cip-math/fns/prng (MIT, see ../NOTICE.md).
// CIP fork feature (see FORK.md). Math spec: ../../docs/MATH.md
//
// String → uint32 seed derivation, so a composite key like
// (elicitation, field, stimulus, criterion, judge model) can seed mulberry32.
// Extracted verbatim from the judge module; the exact bit pattern is
// load-bearing — see deterministicShuffle for why.

/**
 * xorshift-style string hash returning a uint32. Not cryptographic: the only
 * requirement is that distinct keys spread across the seed space so that two
 * different (stimulus, criterion) pairs do not share a shuffle order.
 */
export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
