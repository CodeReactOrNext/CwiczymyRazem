import { beforeEach, describe, expect, it } from "vitest";

import {
  loadGlobalMetronomeVolume,
  loadGlobalTrackVolume,
  loadPracticeSessionSettings,
  saveGlobalMetronomeVolume,
  saveGlobalTrackVolume,
  savePracticeSessionSettings,
} from "./practiceSessionSettings";

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
      speedMultiplier: 0.75,
      isMicEnabled: true,
    });

    expect(loadPracticeSessionSettings("exercise-1")).toEqual({
      isAudioMuted: false,
      isMetronomeMuted: true,
      metronomeBpm: 90,
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

describe("global metronome volume", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing was persisted", () => {
    expect(loadGlobalMetronomeVolume()).toBeNull();
  });

  it("persists and restores the volume regardless of exercise", () => {
    saveGlobalMetronomeVolume(0.7);

    expect(loadGlobalMetronomeVolume()).toBe(0.7);
  });

  it("is shared across exercises instead of being scoped per exercise", () => {
    saveGlobalMetronomeVolume(0.4);
    savePracticeSessionSettings("exercise-1", { metronomeBpm: 90 });
    savePracticeSessionSettings("exercise-2", { metronomeBpm: 140 });

    expect(loadGlobalMetronomeVolume()).toBe(0.4);
  });
});

describe("global track volume", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing was persisted for a role", () => {
    expect(loadGlobalTrackVolume("main")).toBeNull();
    expect(loadGlobalTrackVolume("backing")).toBeNull();
  });

  it("persists and restores the volume regardless of exercise", () => {
    saveGlobalTrackVolume("backing", 0.5);

    expect(loadGlobalTrackVolume("backing")).toBe(0.5);
  });

  it("keeps the main track and backing track volumes independent", () => {
    saveGlobalTrackVolume("main", 0.9);
    saveGlobalTrackVolume("backing", 0.3);

    expect(loadGlobalTrackVolume("main")).toBe(0.9);
    expect(loadGlobalTrackVolume("backing")).toBe(0.3);
  });
});
