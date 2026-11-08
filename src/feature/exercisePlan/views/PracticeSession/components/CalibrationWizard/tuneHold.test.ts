import { describe, expect, it } from "vitest";

import { advanceTuneHold, HOLD_MS, HOLD_RESET_SILENCE_MS, initialTuneHold, isTuned, type TuneHoldState } from "./tuneHold";

const FRAME = 16;

const play = (state: TuneHoldState, cents: number | null, ms: number) => {
  let s = state;
  for (let t = 0; t < ms; t += FRAME) s = advanceTuneHold(s, cents, FRAME);
  return s;
};

describe("advanceTuneHold", () => {
  it("counts a string as tuned only after it has rung in tune for the hold time", () => {
    const almost = play(initialTuneHold(), 3, HOLD_MS - 100);
    expect(isTuned(almost)).toBe(false);
    expect(isTuned(play(almost, 3, 150))).toBe(true);
  });

  it("never passes a string that is a semitone or two off", () => {
    expect(isTuned(play(initialTuneHold(), 150, 5000))).toBe(false);
    expect(isTuned(play(initialTuneHold(), -40, 5000))).toBe(false);
  });

  it("takes progress back when the pitch drifts out", () => {
    const half = play(initialTuneHold(), 0, HOLD_MS / 2);
    const drifted = play(half, 30, 200);
    expect(drifted.heldMs).toBeLessThan(half.heldMs);
  });

  it("ignores a single stray reading", () => {
    let s = play(initialTuneHold(), 2, 300);
    const before = s.heldMs;
    s = advanceTuneHold(s, 90, FRAME);
    expect(s.heldMs).toBeGreaterThan(before);
  });

  it("keeps progress through a short dropout but not a long silence", () => {
    const half = play(initialTuneHold(), 0, HOLD_MS / 2);
    expect(play(half, null, 300).heldMs).toBe(half.heldMs);
    expect(play(half, null, HOLD_RESET_SILENCE_MS + 50).heldMs).toBe(0);
  });
});
