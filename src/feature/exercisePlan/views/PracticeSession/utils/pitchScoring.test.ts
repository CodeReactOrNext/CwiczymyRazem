import { describe, expect, it } from "vitest";

import {
  closerIntonation,
  continuationAttackFloorMs,
  gradeIntonation,
  hasOwnAttack,
  intonationKindOf,
  isSamePitchContinuation,
  liveBendAmount,
  medianCents,
  noteSettleMs,
} from "./pitchScoring";

const D4 = 293.66;
const E4 = 329.63;

describe("hasOwnAttack", () => {
  it("is false for notes nobody picks", () => {
    expect(hasOwnAttack({ isHammerOn: true })).toBe(false);
    expect(hasOwnAttack({ isPullOff: true })).toBe(false);
    expect(hasOwnAttack({ isRelease: true })).toBe(false);
  });

  it("is true for picked notes, bends included", () => {
    expect(hasOwnAttack({})).toBe(true);
    expect(hasOwnAttack({ isBend: true })).toBe(true);
    expect(hasOwnAttack({ isPreBend: true })).toBe(true);
  });
});

describe("intonationKindOf", () => {
  it("reads bends and releases as moving strings, everything else as a held note", () => {
    expect(intonationKindOf({ isBend: true })).toBe("bend");
    expect(intonationKindOf({ isPreBend: true })).toBe("bend");
    expect(intonationKindOf({ isRelease: true })).toBe("release");
    expect(intonationKindOf({})).toBe("note");
    expect(intonationKindOf({ isHammerOn: true })).toBe("note");
  });

  it("has nothing to read on a muted note", () => {
    expect(intonationKindOf({ isDead: true })).toBeNull();
  });
});

describe("noteSettleMs", () => {
  it("waits out the attack, but never most of a short note", () => {
    expect(noteSettleMs(923)).toBe(150);
    expect(noteSettleMs(125)).toBe(50);
  });
});

describe("medianCents", () => {
  it("takes the middle reading, ignoring a stray one", () => {
    expect(medianCents([12, 14, 13, -80, 15])).toBe(13);
    expect(medianCents([10, 20])).toBe(15);
    expect(medianCents([])).toBeNull();
  });
});

describe("isSamePitchContinuation", () => {
  // 65 BPM: a half note rings 1846 ms, a quarter 923 ms.
  it("spots a note asking for the pitch a long previous note leaves ringing", () => {
    expect(isSamePitchContinuation(D4, D4, 1846, 923)).toBe(true);
    expect(isSamePitchContinuation(D4 * 1.01, D4, 1846, 923)).toBe(true); // 17 cents
  });

  it("ignores a different pitch or a pitchless neighbour", () => {
    expect(isSamePitchContinuation(E4, D4, 1846, 923)).toBe(false);
    expect(isSamePitchContinuation(0, D4, 1846, 923)).toBe(false);
  });

  it("leaves fast repeated notes to the usual half-a-note rule", () => {
    // Tremolo in 16ths at 180 BPM: 83 ms apart.
    expect(isSamePitchContinuation(D4, D4, 83, 83)).toBe(false);
    // Eighths at 120 BPM: half the previous note (125 ms) is already tighter
    // than the 140 ms floor.
    expect(isSamePitchContinuation(D4, D4, 250, 250)).toBe(false);
  });
});

describe("continuationAttackFloorMs", () => {
  it("lets an attack be early by no more than the 'close' window", () => {
    expect(continuationAttackFloorMs(923)).toBe(-230);
    expect(continuationAttackFloorMs(100)).toBe(-170);
  });
});

describe("gradeIntonation", () => {
  it("grades by cents off the written pitch, either side", () => {
    expect(gradeIntonation(0)).toBe(3);
    expect(gradeIntonation(-20)).toBe(3);
    expect(gradeIntonation(25)).toBe(2);
    expect(gradeIntonation(-40)).toBe(2);
    expect(gradeIntonation(41)).toBe(1);
  });

  it("gives a bend that never came near the lowest grade", () => {
    expect(gradeIntonation(null)).toBe(1);
  });
});

describe("closerIntonation", () => {
  it("keeps the reading closest to the target", () => {
    let best: number | null = null;
    for (const cents of [-90, -40, -12, 8, 30]) best = closerIntonation(best, cents);
    expect(best).toBe(8);
  });

  it("ignores readings too far off to be this note", () => {
    expect(closerIntonation(null, -200)).toBeNull();
    expect(closerIntonation(-60, 400)).toBe(-60);
    expect(closerIntonation(null, Number.NaN)).toBeNull();
  });
});

describe("liveBendAmount", () => {
  it("measures a bend from the fret up to its target", () => {
    expect(liveBendAmount("bend", D4, D4, 2)).toBeCloseTo(0);
    expect(liveBendAmount("bend", D4 * Math.pow(2, 1 / 12), D4, 2)).toBeCloseTo(0.5);
    expect(liveBendAmount("bend", E4, D4, 2)).toBeCloseTo(1, 2);
  });

  it("measures a release from the top back down", () => {
    expect(liveBendAmount("release", E4, D4, 2)).toBeCloseTo(0, 2);
    expect(liveBendAmount("release", D4, D4, 2)).toBeCloseTo(1);
  });

  it("lets a bend read past the target, so going sharp shows", () => {
    expect(liveBendAmount("bend", D4 * Math.pow(2, 2.5 / 12), D4, 2)).toBeCloseTo(1.25);
  });

  it("has nothing to say about silence or another note entirely", () => {
    expect(liveBendAmount("bend", 0, D4, 2)).toBeNull();
    expect(liveBendAmount("bend", D4 * 2, D4, 2)).toBeNull();
    expect(liveBendAmount("bend", D4 / 2, D4, 2)).toBeNull();
  });
});
