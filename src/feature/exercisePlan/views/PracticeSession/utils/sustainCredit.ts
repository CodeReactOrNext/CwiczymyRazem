/**
 * A note held through most of its length counts as held through all of it.
 *
 * The last stretch of a ringing note is where it fades under the detection
 * gates, so the green fill used to stop a little short of the end on notes
 * played right — which read as "not credited" (owner, 2026-11-08: players
 * were annoyed by it). Score never depended on it — a note scores at its
 * attack — this is what the tab shows.
 */
export const SUSTAIN_COMPLETE_SHARE = 0.8;

export interface HeldFill {
  /** The beat the fill reaches. */
  beat: number;
  /** True once the hold earned the whole note — the fill jumps to its end. */
  complete: boolean;
}

/**
 * Where a held note's fill goes, given how far the note has been heard ringing.
 * Beats are counted on the same clock as the note's own start and end.
 */
export function heldFillTarget(heldTo: number, beatStart: number, beatEnd: number): HeldFill {
  const length = beatEnd - beatStart;
  // Beats are sums of float durations — 14.6 − 13 reads 1.5999… — so a hair
  // under the line still counts.
  if (length > 0 && heldTo - beatStart >= SUSTAIN_COMPLETE_SHARE * length - 1e-9) {
    return { beat: beatEnd, complete: true };
  }
  return { beat: Math.min(heldTo, beatEnd), complete: false };
}
