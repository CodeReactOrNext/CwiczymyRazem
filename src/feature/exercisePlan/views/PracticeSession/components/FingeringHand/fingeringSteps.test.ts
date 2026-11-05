import { fingerPairDyadsExercise } from "feature/exercisePlan/data/exerises/fingerPairDyads/fingerPairDyads";
import { describe, expect, it } from "vitest";

import { fingeringSteps, stepIndexAt } from "./fingeringSteps";

describe("fingeringSteps", () => {
  const steps = fingeringSteps(fingerPairDyadsExercise.tablature);

  it("makes one step per fingered beat, with the hand in 5th position", () => {
    expect(steps).toHaveLength(32);
    expect(steps[0]).toEqual({
      start: 0,
      position: 5,
      notes: [
        { string: 6, fret: 5, finger: 1 },
        { string: 5, fret: 7, finger: 3 },
      ],
    });
    expect(steps[1].notes.map((n) => n.finger)).toEqual([2, 4]);
    expect(steps.every((s) => s.position === 5)).toBe(true);
  });

  it("finds the step sounding at a beat", () => {
    expect(stepIndexAt(steps, 0)).toBe(0);
    expect(stepIndexAt(steps, 0.99)).toBe(0);
    expect(stepIndexAt(steps, 1)).toBe(1);
    expect(stepIndexAt(steps, 31.5)).toBe(31);
    expect(stepIndexAt([], 3)).toBe(-1);
  });

  it("skips beats without fingering", () => {
    const only = fingeringSteps([
      {
        timeSignature: [4, 4],
        beats: [
          { duration: 1, notes: [] },
          { duration: 1, notes: [{ string: 1, fret: 0 }] },
          { duration: 2, notes: [{ string: 2, fret: 3, finger: 2 }] },
        ],
      },
    ]);
    expect(only).toEqual([{ start: 2, position: 2, notes: [{ string: 2, fret: 3, finger: 2 }] }]);
  });
});
