import { describe, expect, it } from "vitest";

import {
  applyHitNotes,
  applyMissedNotes,
  createNoteHitVisualState,
  resetFrozenNoteState,
  resetNoteHitVisualState,
} from "./noteHitVisualState";

describe("noteHitVisualState", () => {
  it("regression: RESET clears hitNotes, not just missedNotes", () => {
    // Bug #737 — after stopping / a mistake and restarting, previously-hit
    // notes stayed lit green forever because RESET only cleared missedNotes.
    const state = createNoteHitVisualState();
    applyHitNotes(state, { "0-0-0": true, "0-1-0": 1.5 }, 1000, 0);
    applyMissedNotes(state, { "0-2-0": true }, 0);

    resetNoteHitVisualState(state);

    expect(state.hitNotes).toEqual({});
    expect(state.missedNotes).toEqual({});
  });

  it("full reset also clears frozen state and hit-animation timestamps", () => {
    const state = createNoteHitVisualState();
    applyHitNotes(state, { "0-0-0": true }, 1000, 0);
    // Simulate a natural loop wrap (fewer keys) so frozen state gets populated.
    applyHitNotes(state, {}, 1100, 1);

    expect(state.hasFrozen).toBe(true);

    resetNoteHitVisualState(state);

    expect(state.frozenHitNotes).toEqual({});
    expect(state.frozenMissedNotes).toEqual({});
    expect(state.hasFrozen).toBe(false);
    expect(state.hitTimestamps).toEqual({});
    expect(state.hitTimestampsCount).toBe(0);
  });

  it("freezes the previous pass when the hit set shrinks (loop wrap)", () => {
    const state = createNoteHitVisualState();
    applyHitNotes(state, { "0-0-0": true, "0-1-0": true }, 1000, 2);

    applyHitNotes(state, { "0-0-0": true }, 1200, 3);

    expect(state.hasFrozen).toBe(true);
    expect(state.frozenTile).toBe(3);
    expect(state.frozenHitNotes).toEqual({ "0-0-0": true, "0-1-0": true });
    expect(state.hitNotes).toEqual({ "0-0-0": true });
  });

  it("does not freeze when the hit set only grows", () => {
    const state = createNoteHitVisualState();
    applyHitNotes(state, { "0-0-0": true }, 1000, 0);
    applyHitNotes(state, { "0-0-0": true, "0-1-0": true }, 1050, 0);

    expect(state.hasFrozen).toBe(false);
  });

  it("stamps a timestamp only for newly-hit notes, and drops it once cleared", () => {
    const state = createNoteHitVisualState();
    applyHitNotes(state, { "0-0-0": true }, 1000, 0);
    expect(state.hitTimestamps["0-0-0"]).toBe(1000);
    expect(state.hitTimestampsCount).toBe(1);

    // Re-sending the same key at a later time must not restamp it.
    applyHitNotes(state, { "0-0-0": true }, 2000, 0);
    expect(state.hitTimestamps["0-0-0"]).toBe(1000);
    expect(state.hitTimestampsCount).toBe(1);

    // Loop restart clears it (key no longer present in the new set).
    applyHitNotes(state, {}, 3000, 1);
    expect(state.hitTimestamps).toEqual({});
    expect(state.hitTimestampsCount).toBe(0);
  });

  it("freezes the previous pass when the missed set shrinks (loop wrap)", () => {
    const state = createNoteHitVisualState();
    applyMissedNotes(state, { "0-0-0": true, "0-1-0": true }, 1);
    applyMissedNotes(state, {}, 2);

    expect(state.hasFrozen).toBe(true);
    expect(state.frozenTile).toBe(2);
    expect(state.frozenMissedNotes).toEqual({ "0-0-0": true, "0-1-0": true });
    expect(state.missedNotes).toEqual({});
  });

  it("regression: one wrap freezes hits and misses from the same pass", () => {
    // Both maps arrive as separate messages carrying the same finished tile.
    // The miss message used to re-freeze on its own and captured hitNotes
    // *after* the hit message had already reset it, wiping the green snapshot.
    const state = createNoteHitVisualState();
    applyHitNotes(state, { "0-0-0": true }, 1000, 0);
    applyMissedNotes(state, { "0-1-0": true }, 0);

    // Loop wrap — matching clears both maps in one flush.
    applyHitNotes(state, {}, 1100, 1);
    applyMissedNotes(state, {}, 1);

    expect(state.frozenTile).toBe(1);
    expect(state.frozenHitNotes).toEqual({ "0-0-0": true });
    expect(state.frozenMissedNotes).toEqual({ "0-1-0": true });
  });

  it("regression: a pass played with no hits clears the frozen greens", () => {
    // Misses always pile up on a pass the user sits out, so their shrink used
    // to re-arm the freeze every loop while frozenHitNotes stayed behind from
    // the last pass actually played — the same greens repainted forever.
    const state = createNoteHitVisualState();
    applyHitNotes(state, { "0-0-0": true }, 1000, 0);
    applyHitNotes(state, {}, 1100, 1);
    applyMissedNotes(state, {}, 1);
    expect(state.frozenHitNotes).toEqual({ "0-0-0": true });

    // Next pass: nothing played, every note misses, then the loop wraps again.
    applyMissedNotes(state, { "0-0-0": true, "0-1-0": true }, 1);
    applyHitNotes(state, {}, 2100, 2);
    applyMissedNotes(state, {}, 2);

    expect(state.frozenTile).toBe(2);
    expect(state.frozenHitNotes).toEqual({});
    expect(state.frozenMissedNotes).toEqual({ "0-0-0": true, "0-1-0": true });
  });

  it("DATA reset (resetFrozenNoteState) drops the frozen tail but preserves live progress", () => {
    const state = createNoteHitVisualState();
    applyHitNotes(state, { "0-0-0": true }, 1000, 0);
    applyMissedNotes(state, { "0-1-0": true }, 0);
    applyHitNotes(state, {}, 1100, 1); // loop wrap -> freezes

    resetFrozenNoteState(state);

    expect(state.hasFrozen).toBe(false);
    expect(state.frozenHitNotes).toEqual({});
    expect(state.frozenMissedNotes).toEqual({});
    // Live maps must be untouched — a plain style/palette DATA refresh must
    // not wipe in-progress scoring.
    expect(state.hitNotes).toEqual({});
    expect(state.missedNotes).toEqual({ "0-1-0": true });
  });
});
