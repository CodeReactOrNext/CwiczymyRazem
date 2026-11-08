/**
 * When a string counts as tuned: its pitch has to sit inside ±IN_TUNE_CENTS
 * for HOLD_MS of ringing in total. A reading out of tune takes time back
 * (faster than it was earned), so drifting through the window while turning
 * the peg doesn't pass; short gaps in the reading (the detector briefly losing
 * a decaying note) don't wipe the progress, a longer silence does.
 */

export const IN_TUNE_CENTS = 8;
/** "Almost there" colour band. */
export const CLOSE_CENTS = 25;
export const HOLD_MS = 700;
/** Silence longer than this starts the hold over. */
export const HOLD_RESET_SILENCE_MS = 1500;
/** Out-of-tune readings take progress back this many times faster than in-tune ones give it. */
const DECAY_RATE = 2;
/** How many recent readings the in-tune decision is a median of. */
export const SMOOTHING_READINGS = 5;

export interface TuneHoldState {
  heldMs: number;
  silentMs: number;
  /** Most recent readings, in cents, oldest first. */
  recent: number[];
}

export const initialTuneHold = (): TuneHoldState => ({ heldMs: 0, silentMs: 0, recent: [] });

const median = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * @param cents this frame's distance from the target, or null when no note is heard
 * @param dtMs time since the previous frame
 */
export function advanceTuneHold(state: TuneHoldState, cents: number | null, dtMs: number): TuneHoldState {
  if (cents === null) {
    const silentMs = state.silentMs + dtMs;
    return silentMs >= HOLD_RESET_SILENCE_MS
      ? { heldMs: 0, silentMs, recent: [] }
      : { ...state, silentMs };
  }
  const recent = [...state.recent, cents].slice(-SMOOTHING_READINGS);
  const inTune = Math.abs(median(recent)) <= IN_TUNE_CENTS;
  const heldMs = inTune
    ? Math.min(HOLD_MS, state.heldMs + dtMs)
    : Math.max(0, state.heldMs - dtMs * DECAY_RATE);
  return { heldMs, silentMs: 0, recent };
}

export const isTuned = (state: TuneHoldState) => state.heldMs >= HOLD_MS;
