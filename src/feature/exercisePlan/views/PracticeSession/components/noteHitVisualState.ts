// Bookkeeping for the tablature worker's per-note hit/miss overlay — pulled out
// of TablatureViewer.worker.ts so it can be unit tested without a real Worker/
// OffscreenCanvas. The worker owns one of these and mutates it as HIT_NOTES /
// MISSED_NOTES / RESET messages arrive from the main thread.
export interface NoteHitVisualState {
  /** Live, growing-only within a pass — noteKey -> true (hit) or the beat the
   *  hold last confirmed (progressive green fill). */
  hitNotes: Record<string, boolean | number>;
  missedNotes: Record<string, boolean>;
  /** Frozen snapshot of the finishing repetition's hit/miss state, painted over
   *  the outgoing tail while a full-exercise loop scrolls the next pass in. */
  frozenHitNotes: Record<string, boolean | number>;
  frozenMissedNotes: Record<string, boolean>;
  hasFrozen: boolean;
  /** Tile index the frozen snapshot belongs to. */
  frozenTile: number;
  /** noteKey -> wall-clock ms when first hit, drives the pop/glow animation. */
  hitTimestamps: Record<string, number>;
  hitTimestampsCount: number;
}

export function createNoteHitVisualState(): NoteHitVisualState {
  return {
    hitNotes: {},
    missedNotes: {},
    frozenHitNotes: {},
    frozenMissedNotes: {},
    hasFrozen: false,
    frozenTile: -1,
    hitTimestamps: {},
    hitTimestampsCount: 0,
  };
}

/** HIT_NOTES message. Hits only ever grow within a pass — a shrink means the
 *  loop wrapped and matching reset, so freeze the finishing pass's state for
 *  the outgoing tail, and stamp newly-hit notes for the pop animation. */
export function applyHitNotes(
  state: NoteHitVisualState,
  newHits: Record<string, boolean | number>,
  now: number,
  activeTile: number,
): void {
  if (Object.keys(newHits).length < Object.keys(state.hitNotes).length) {
    state.frozenHitNotes = state.hitNotes;
    state.frozenTile = activeTile;
    state.hasFrozen = true;
  }
  for (const key of Object.keys(newHits)) {
    if (newHits[key] && !state.hitNotes[key]) {
      if (!state.hitTimestamps[key]) state.hitTimestampsCount++;
      state.hitTimestamps[key] = now;
    }
  }
  for (const key of Object.keys(state.hitTimestamps)) {
    if (!newHits[key]) {
      delete state.hitTimestamps[key];
      state.hitTimestampsCount--;
    }
  }
  state.hitNotes = newHits;
}

/** MISSED_NOTES message — same shrink-detect as hits, freezing the finishing
 *  pass's misses for the tail. */
export function applyMissedNotes(
  state: NoteHitVisualState,
  newMissed: Record<string, boolean>,
  activeTile: number,
): void {
  if (Object.keys(newMissed).length < Object.keys(state.missedNotes).length) {
    state.frozenMissedNotes = state.missedNotes;
    state.frozenTile = activeTile;
    state.hasFrozen = true;
  }
  state.missedNotes = newMissed;
}

/** DATA message (new render data) — the frozen tail belongs to the previous
 *  score layout, so drop it. Live hit/missed maps are intentionally left
 *  alone: DATA also fires for a plain style/palette change mid-exercise,
 *  which must not wipe in-progress scoring. */
export function resetFrozenNoteState(state: NoteHitVisualState): void {
  state.frozenHitNotes = {};
  state.frozenMissedNotes = {};
  state.hasFrozen = false;
}

/** RESET message (tab restart, BPM/speed change, count-in restart, …) — a full
 *  visual reset. Must clear BOTH hit and missed maps: leaving `hitNotes`
 *  behind made every previously-hit note stay lit green after a restart, even
 *  once the underlying score/game state had already been reset back to zero. */
export function resetNoteHitVisualState(state: NoteHitVisualState): void {
  state.hitNotes = {};
  state.missedNotes = {};
  resetFrozenNoteState(state);
  state.hitTimestamps = {};
  state.hitTimestampsCount = 0;
}
