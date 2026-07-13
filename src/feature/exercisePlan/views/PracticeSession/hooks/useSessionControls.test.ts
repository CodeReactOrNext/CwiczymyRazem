import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Exercise } from "../../../types/exercise.types";
import { useSessionControls } from "./useSessionControls";

const fireKeyDown = (init: KeyboardEventInit) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
};

const buildOptions = (overrides: Partial<Exercise> = {}) => {
  const metronome = {
    isPlaying: false,
    startMetronome: vi.fn(),
    stopMetronome: vi.fn(),
    restartMetronome: vi.fn(),
    bpm: 100,
    setBpm: vi.fn(),
    minBpm: 40,
    maxBpm: 208,
    handleSetRecommendedBpm: vi.fn(),
  };

  const currentExercise = { id: "ex-1", title: "Exercise", ...overrides } as Exercise;

  return {
    metronome,
    options: {
      isPlaying: false,
      stopTimer: vi.fn(),
      startTimer: vi.fn(),
      resetTimer: vi.fn(),
      metronome,
      currentExercise,
      currentExerciseIndex: 1,
      isLastExercise: false,
      jumpToExercise: vi.fn(),
      handleNextExercise: vi.fn(),
      restartFullSession: vi.fn(),
      isMicEnabled: false,
      closeAudio: vi.fn(),
      updateMicPersistence: vi.fn(),
      isAudioMuted: false,
      setIsAudioMuted: vi.fn(),
      speedMultiplier: 1,
      setSpeedMultiplier: vi.fn(),
      setEarTrainingScore: vi.fn(),
      setIsRiddleGuessed: vi.fn(),
      handleRevealRiddle: vi.fn(),
      saveCurrentScores: vi.fn().mockResolvedValue(undefined),
      noteMatchingHandle: { current: null },
      loopsCompletedRef: { current: 0 },
      tabRestartKey: 0,
      setTabRestartKey: vi.fn(),
    },
  };
};

describe("useSessionControls — tempo hotkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bumps the tempo by +1/-1 bpm on ArrowUp/ArrowDown when the exercise has a metronome", () => {
    const { metronome, options } = buildOptions({ metronomeSpeed: { min: 40, max: 208, recommended: 100 } } as any);
    renderHook(() => useSessionControls(options));

    fireKeyDown({ key: "ArrowUp" });
    expect(metronome.setBpm).toHaveBeenLastCalledWith(101);

    fireKeyDown({ key: "ArrowDown" });
    expect(metronome.setBpm).toHaveBeenLastCalledWith(99);
  });

  it("bumps the tempo by +5/-5 bpm on Shift+ArrowUp/ArrowDown", () => {
    const { metronome, options } = buildOptions({ metronomeSpeed: { min: 40, max: 208, recommended: 100 } } as any);
    renderHook(() => useSessionControls(options));

    fireKeyDown({ key: "ArrowUp", shiftKey: true });
    expect(metronome.setBpm).toHaveBeenLastCalledWith(105);

    fireKeyDown({ key: "ArrowDown", shiftKey: true });
    expect(metronome.setBpm).toHaveBeenLastCalledWith(95);
  });

  it("clamps the tempo to minBpm/maxBpm", () => {
    const { metronome, options } = buildOptions({ metronomeSpeed: { min: 40, max: 208, recommended: 100 } } as any);
    metronome.bpm = 207;
    renderHook(() => useSessionControls(options));

    fireKeyDown({ key: "ArrowUp", shiftKey: true });
    expect(metronome.setBpm).toHaveBeenLastCalledWith(208);
  });

  it("resets to the recommended tempo on Enter", () => {
    const { metronome, options } = buildOptions({ metronomeSpeed: { min: 40, max: 208, recommended: 100 } } as any);
    renderHook(() => useSessionControls(options));

    fireKeyDown({ key: "Enter" });
    expect(metronome.handleSetRecommendedBpm).toHaveBeenCalledTimes(1);
  });

  it("ignores tempo hotkeys when the exercise has no metronome", () => {
    const { metronome, options } = buildOptions();
    renderHook(() => useSessionControls(options));

    fireKeyDown({ key: "ArrowUp" });
    fireKeyDown({ key: "Enter" });
    expect(metronome.setBpm).not.toHaveBeenCalled();
    expect(metronome.handleSetRecommendedBpm).not.toHaveBeenCalled();
  });

  it("still navigates exercises on plain ArrowLeft/ArrowRight", async () => {
    const { options } = buildOptions({ metronomeSpeed: { min: 40, max: 208, recommended: 100 } } as any);
    renderHook(() => useSessionControls(options));

    fireKeyDown({ key: "ArrowLeft" });
    expect(options.jumpToExercise).toHaveBeenCalledWith(0);

    fireKeyDown({ key: "ArrowRight" });
    await vi.waitFor(() => expect(options.handleNextExercise).toHaveBeenCalled());
  });
});
