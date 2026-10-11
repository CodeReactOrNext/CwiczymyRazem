import { describe, expect, it } from "vitest";

import { exercisesAgregat } from "../data/exercisesAgregat";
import type { Exercise } from "../types/exercise.types";
import { getExerciseTimeLimitMs, isRunWithinExerciseTime } from "./exerciseTimeLimit";

const custom = (timeInMinutes: number) =>
  ({ id: "custom-ex", timeInMinutes }) as Pick<Exercise, "id" | "timeInMinutes" | "songData">;

describe("getExerciseTimeLimitMs", () => {
  it("adds a tenth of the time as slack", () => {
    expect(getExerciseTimeLimitMs(custom(10))).toBe(660_000);
  });

  it("never gives a short drill less than 15 seconds of slack", () => {
    expect(getExerciseTimeLimitMs(custom(1))).toBe(75_000);
  });

  it("holds a catalogue exercise to its own time, not the plan's slot", () => {
    const catalogued = exercisesAgregat[0];
    const stretched = { ...catalogued, timeInMinutes: 60 };

    expect(getExerciseTimeLimitMs(stretched)).toBe(getExerciseTimeLimitMs(catalogued));
    expect(getExerciseTimeLimitMs(stretched)).toBeLessThan(60 * 60_000);
  });

  it("holds a song to the default song slot", () => {
    const song = { id: "song-abc", timeInMinutes: 45, songData: { songId: "abc", title: "T", artist: "A" } };

    expect(getExerciseTimeLimitMs(song)).toBe(660_000);
  });

  it("lets a play-along run as long as its video", () => {
    expect(getExerciseTimeLimitMs(custom(2), 300)).toBe(330_000);
  });

  it("has no limit for an exercise without a time", () => {
    expect(getExerciseTimeLimitMs(custom(0))).toBeNull();
  });
});

describe("isRunWithinExerciseTime", () => {
  it("accepts a run inside the slack", () => {
    expect(isRunWithinExerciseTime(custom(2), 134_000)).toBe(true);
  });

  it("rejects a run past it", () => {
    expect(isRunWithinExerciseTime(custom(2), 136_000)).toBe(false);
  });

  it("accepts anything when the exercise has no time", () => {
    expect(isRunWithinExerciseTime(custom(0), 99 * 60_000)).toBe(true);
  });
});
