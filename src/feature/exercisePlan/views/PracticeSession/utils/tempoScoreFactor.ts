/** Tempo a note is worth exactly its base points at. */
const REFERENCE_BPM = 100;

/**
 * What one hit note is worth at a tempo, relative to its base points. Read off
 * the tempo the player actually hears (metronome × speed multiplier), so 100 BPM
 * at ×0.5 and 50 BPM at ×1 score the same.
 *
 * Fourth root on purpose: a faster run already fits more notes into the same
 * minutes, so the per-note bonus only tops that up. Doubling the tempo is worth
 * ~2.4× the score over a timed run — speed pays, but it doesn't run away.
 */
export const tempoScoreFactor = (effectiveBpm: number): number =>
  effectiveBpm > 0 ? (effectiveBpm / REFERENCE_BPM) ** 0.25 : 1;
