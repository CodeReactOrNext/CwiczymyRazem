import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { pinkyPowerDrillExercise } from "feature/exercisePlan/data/exerises/pinkyPowerDrill/pinkyPowerDrill";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

const notes = (exercise: Exercise) =>
  (exercise.tablature ?? []).flatMap((bar) => bar.beats.flatMap((beat) => beat.notes));

describe("exercise fingerings", () => {
  it("fingers every note of the pinky drill one per fret, each pattern opening on the pinky", () => {
    expect(notes(pinkyPowerDrillExercise).every((n) => n.finger === n.fret - 4)).toBe(true);
    for (const bar of pinkyPowerDrillExercise.tablature ?? []) {
      expect(bar.beats[0].notes[0].finger).toBe(4);
    }
  });

  it("fingers the Petrucci stretch one per fret across frets 10-13", () => {
    expect(notes(jpStretching).every((n) => n.finger === n.fret - 9)).toBe(true);
  });
});
