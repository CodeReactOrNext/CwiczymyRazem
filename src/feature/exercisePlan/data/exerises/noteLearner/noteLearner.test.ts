import { huntPositions } from "feature/exercisePlan/views/PracticeSession/hooks/useNoteHunt";
import { NOTES } from "utils/audio/noteUtils";
import { beforeEach, describe, expect, it } from "vitest";

import { nextLearnerNote, noteLearnerExercise, noteLearnerRegion } from "./noteLearner";
import { useNoteLearnerStore } from "./noteLearnerStore";

const NATURALS = ["C", "D", "E", "F", "G", "A", "B"];

describe("noteLearner", () => {
  beforeEach(() => {
    useNoteLearnerStore.setState({ strings: 6, notes: "naturals" });
  });

  it("deals every note of the pool once before any comes back", () => {
    nextLearnerNote("all"); // start a fresh naturals bag below
    const pass = Array.from({ length: NATURALS.length }, () => nextLearnerNote("naturals"));
    expect([...pass].sort()).toEqual([...NATURALS].sort());

    const chromatic = Array.from({ length: NOTES.length }, () => nextLearnerNote("all"));
    expect(new Set(chromatic).size).toBe(NOTES.length);
  });

  it("never asks the same note twice in a row across bags", () => {
    let previous = nextLearnerNote("naturals");
    for (let i = 0; i < 200; i++) {
      const note = nextLearnerNote("naturals");
      expect(note).not.toBe(previous);
      previous = note;
    }
  });

  it("puts every note in exactly one spot on a single string", () => {
    const { startFret, endFret } = noteLearnerRegion(6);
    for (const note of NOTES) {
      expect(huntPositions(note, [startFret, endFret], [6])).toHaveLength(1);
    }
  });

  it("rolls targets from the picked string and notes", () => {
    useNoteLearnerStore.setState({ strings: 3, notes: "naturals" });
    const onG = noteLearnerExercise.rollHuntTarget!();
    expect(onG.strings).toEqual([3]);
    expect(onG.region).toEqual({ startFret: 0, endFret: 11 });
    expect(NATURALS).toContain(onG.goal);

    useNoteLearnerStore.setState({ strings: "all", notes: "all" });
    const wholeNeck = noteLearnerExercise.rollHuntTarget!();
    expect(wholeNeck.strings).toBeUndefined();
    expect(wholeNeck.region).toEqual({ startFret: 0, endFret: 12 });
  });

  it("is a mic hunt that waits for the answer and shows the positions", () => {
    expect(noteLearnerExercise.noteHuntConfig).toMatchObject({
      mode: "region",
      advanceOn: "solved",
      showPositions: true,
    });
    expect(noteLearnerExercise.disableMic).toBeUndefined();
    expect(noteLearnerExercise.customGoalStrings).toBeUndefined();
  });
});
