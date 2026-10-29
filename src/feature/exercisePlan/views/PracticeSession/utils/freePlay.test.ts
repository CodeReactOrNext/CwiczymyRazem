import type { DetectedNoteEvent } from "hooks/guitarBufferProcessor";
import { describe, expect, it } from "vitest";

import { freshAttacks } from "./freePlay";

const event = (onsetMs: number, pitchHz: number): DetectedNoteEvent => ({ onsetMs, pitchHz, peakVolume: 0.2 });

describe("freshAttacks", () => {
  it("places each attack on the beat it was played on", () => {
    const seen = new Set<number>();
    // Now is beat 10 at 10 000 ms, a beat every 500 ms.
    const attacks = freshAttacks([event(9_750, 440), event(9_000, 330)], seen, 10_000, 10, 500);
    expect(attacks).toEqual([
      { beat: 8, pitchHz: 330 },
      { beat: 9.5, pitchHz: 440 },
    ]);
  });

  it("hands each attack on once, and waits for its pitch", () => {
    const seen = new Set<number>();
    const unresolved = event(9_900, 0);
    expect(freshAttacks([event(9_750, 440), unresolved], seen, 10_000, 10, 500)).toHaveLength(1);
    const resolved = { ...unresolved, pitchHz: 220 };
    const [late] = freshAttacks([event(9_750, 440), resolved], seen, 10_100, 10.2, 500);
    expect(late.pitchHz).toBe(220);
    expect(late.beat).toBeCloseTo(9.8);
  });

  it("drops an attack pitched above any string — a click or a cue the mic heard", () => {
    const seen = new Set<number>();
    expect(freshAttacks([event(9_500, 5_100), event(9_750, 1_318)], seen, 10_000, 10, 500)).toEqual([
      { beat: 9.5, pitchHz: 1_318 },
    ]);
  });

  it("forgets the onsets no longer in the buffer", () => {
    const seen = new Set<number>(Array.from({ length: 300 }, (_, i) => i));
    freshAttacks([event(5_000, 440)], seen, 10_000, 10, 500);
    expect([...seen]).toEqual([5_000]);
  });
});
