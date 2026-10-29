import type { DetectedNoteEvent } from "hooks/guitarBufferProcessor";

/** One attack the player made, placed on the session's clock. */
export interface FreePlayAttack {
  /** Beats since the run's first beat, latency taken off — negative in the count-in. */
  beat: number;
  pitchHz: number;
}

/**
 * The session's clock and whatever the player played since the last frame,
 * for a mode with no notes to match against — a solo over chords is judged
 * by what it plays against the harmony, not by a tab.
 */
export interface FreePlayFrame {
  /** Beats since the run's first beat, latency taken off; it never wraps with the tab. */
  beat: number;
  msPerBeat: number;
  /** Attacks heard since the last frame, oldest first. */
  attacks: FreePlayAttack[];
  /** Semitones the whole guitar is tuned off standard (E♭ standard: −1). */
  tuningShift: number;
}

/**
 * Above any guitar's fundamental — the 24th fret of the high e is 1319 Hz. An
 * attack read up there is something else the mic heard (a click, a cue).
 */
export const MAX_ATTACK_HZ = 1500;

/** Past this many remembered onsets, the ones no longer in the buffer are let go. */
const SEEN_PRUNE_AT = 256;

/**
 * The attacks in the detector's buffer not handed on yet, placed on the beat
 * clock. Both clocks are latency-compensated already (the onsets in the
 * Date.now() domain, `beatNow` at `nowMs`), so an attack's beat is the
 * frame's minus how long ago it came. An attack waits until its pitch has
 * resolved; one that never does is dropped, and so is one pitched above any
 * string. `seen` is the caller's, kept across frames.
 */
export const freshAttacks = (
  events: readonly DetectedNoteEvent[],
  seen: Set<number>,
  nowMs: number,
  beatNow: number,
  msPerBeat: number,
): FreePlayAttack[] => {
  const fresh: FreePlayAttack[] = [];
  for (const event of events) {
    if (event.pitchHz <= 0 || seen.has(event.onsetMs)) continue;
    seen.add(event.onsetMs);
    if (event.pitchHz > MAX_ATTACK_HZ) continue;
    fresh.push({ beat: beatNow + (event.onsetMs - nowMs) / msPerBeat, pitchHz: event.pitchHz });
  }
  if (seen.size > SEEN_PRUNE_AT) {
    const live = new Set(events.map((event) => event.onsetMs));
    for (const onset of seen) if (!live.has(onset)) seen.delete(onset);
  }
  return fresh.sort((a, b) => a.beat - b.beat);
};
