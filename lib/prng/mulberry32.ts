// Lifted from Weval Studio cip-math/fns/prng (MIT, see ../NOTICE.md).
// CIP fork feature (see FORK.md): the fork's only seeded PRNG.
// Math spec: ../../docs/MATH.md
//
// Sole consumer is deterministicShuffle, which orders judge criteria options
// and records that order on ElicitationJudgeScore.shownOrder — so the exact
// stream is a persisted contract, pinned by golden-vector tests. `Math.random`
// (or `Date.now` seeding) anywhere it reaches would break the determinism
// contract: the same input must produce a deep-equal result.
//
// The polis pipeline used to seed power-iteration init vectors from this; since
// it moved to an exact eigensolver it needs no randomness at all.

/**
 * Standard mulberry32: a 32-bit-state generator returning numbers in [0, 1).
 * Small, fast, and non-cryptographic — shuffling display order needs
 * reproducibility, not unpredictability.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
