import { beforeEach, describe, expect, it } from "vitest";

import { loadPracticeSessionSettings, savePracticeSessionSettings } from "./practiceSessionSettings";

describe("practiceSessionSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing was persisted for an exercise", () => {
    expect(loadPracticeSessionSettings("exercise-1")).toBeNull();
  });

  it("persists and restores settings for a given exercise", () => {
    savePracticeSessionSettings("exercise-1", {
      isAudioMuted: false,
      isMetronomeMuted: true,
      metronomeBpm: 90,
      metronomeVolume: 0.7,
      speedMultiplier: 0.75,
      isMicEnabled: true,
    });

    expect(loadPracticeSessionSettings("exercise-1")).toEqual({
      isAudioMuted: false,
      isMetronomeMuted: true,
      metronomeBpm: 90,
      metronomeVolume: 0.7,
      speedMultiplier: 0.75,
      isMicEnabled: true,
    });
  });

  it("keeps settings for different exercises independent", () => {
    savePracticeSessionSettings("exercise-1", { metronomeBpm: 90 });
    savePracticeSessionSettings("exercise-2", { metronomeBpm: 140 });

    expect(loadPracticeSessionSettings("exercise-1")?.metronomeBpm).toBe(90);
    expect(loadPracticeSessionSettings("exercise-2")?.metronomeBpm).toBe(140);
  });

  it("merges partial updates instead of overwriting the whole entry", () => {
    savePracticeSessionSettings("exercise-1", { metronomeBpm: 90, speedMultiplier: 1 });
    savePracticeSessionSettings("exercise-1", { speedMultiplier: 0.5 });

    expect(loadPracticeSessionSettings("exercise-1")).toEqual({
      metronomeBpm: 90,
      speedMultiplier: 0.5,
    });
  });
});
