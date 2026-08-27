import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { hasExerciseProgress } from "./hasExerciseProgress";

describe("hasExerciseProgress", () => {
  it("reports nothing for a missing or empty record", () => {
    expect(hasExerciseProgress(null)).toBe(false);
    expect(hasExerciseProgress(undefined)).toBe(false);
    expect(hasExerciseProgress({ completedBpms: [] })).toBe(false);
  });

  it("ignores zeroed scores — an attempt worth no points is not progress", () => {
    expect(
      hasExerciseProgress({
        completedBpms: [],
        micHighScore: 0,
        earTrainingHighScore: 0,
        clickHighScore: 0,
        recordBpm: 0,
      })
    ).toBe(false);
  });

  it("counts a cleared tempo", () => {
    expect(hasExerciseProgress({ completedBpms: [80] })).toBe(true);
  });

  it("counts every score type, including the click hunts and scale records", () => {
    expect(hasExerciseProgress({ micHighScore: 120 })).toBe(true);
    expect(hasExerciseProgress({ earTrainingHighScore: 3 })).toBe(true);
    expect(hasExerciseProgress({ clickHighScore: 40 })).toBe(true);
    expect(hasExerciseProgress({ recordBpm: 140 })).toBe(true);
  });

  it("counts a finished run that scored nothing — the only mark open exercises get", () => {
    expect(hasExerciseProgress({ completedBpms: [], completedAt: Timestamp.now() })).toBe(true);
  });
});
