// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { getExerciseUserRank } from "feature/leadboard/services/getExerciseUserRank";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { markExerciseCompleted, saveLeaderboardEntry, updateMicHighScore } from "../../../services/bpmProgressService";
import type { Exercise } from "../../../types/exercise.types";
import type { NoteMatchingHandle } from "../contexts/NoteMatchingContext";
import { useScoreSaving } from "./useScoreSaving";

vi.mock("../../../services/bpmProgressService", () => ({
  markExerciseCompleted: vi.fn(),
  saveLeaderboardEntry: vi.fn(),
  updateClickHighScore: vi.fn(),
  updateEarTrainingHighScore: vi.fn(),
  updateMicHighScore: vi.fn(),
}));

vi.mock("feature/leadboard/services/getExerciseUserRank", () => ({
  getExerciseUserRank: vi.fn(),
}));

// The selectors only have to be distinguishable; `useAppSelector` runs them.
vi.mock("feature/user/store/userSlice", () => ({
  selectUserAuth: () => "me",
  selectUserName: () => "Kasia",
  selectUserAvatar: () => "kasia.png",
}));

vi.mock("store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

const exercise = {
  id: "ex1",
  title: "C Minor Pentatonic",
  category: "technique",
  metronomeSpeed: { min: 40, max: 200, recommended: 90 },
} as unknown as Exercise;

/** An exercise the player can't set a tempo on, so no tempo is worth reporting. */
const untimedExercise = { ...exercise, metronomeSpeed: undefined } as unknown as Exercise;

const handleFor = (score: number) =>
  ({ current: { snapshot: () => ({ score, accuracy: 99 }) } }) as unknown as {
    current: NoteMatchingHandle | null;
  };

const saveRun = async ({
  score,
  previousBest,
  activeExercise = exercise,
  sessionBpm = 90,
}: {
  score: number;
  previousBest: number;
  activeExercise?: Exercise;
  sessionBpm?: number;
}) => {
  vi.mocked(updateMicHighScore).mockResolvedValue({
    isNewRecord: score > previousBest,
    previousScore: previousBest,
  });

  const { result } = renderHook(() =>
    useScoreSaving({
      activeExercise,
      currentExercise: activeExercise,
      isMicEnabled: true,
      earTrainingScore: 0,
      noteMatchingHandle: handleFor(score),
      sessionBpm,
    })
  );

  await act(async () => {
    await result.current.saveCurrentScores();
  });

  return result;
};

describe("useScoreSaving standings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getExerciseUserRank).mockResolvedValue(2);
  });

  it("reports the tempo and the place the score landed in", async () => {
    const result = await saveRun({ score: 21_375, previousBest: 0 });

    expect(saveLeaderboardEntry).toHaveBeenCalledWith("me", "ex1", 21_375, "Kasia", "kasia.png", 90);
    expect(result.current.micStandingRef.current).toEqual({ bpm: 90, rank: 2 });
  });

  it("ranks the standing record, not a run that came in under it", async () => {
    await saveRun({ score: 21_375, previousBest: 40_000 });

    // The place belongs to the score that actually stands on the board.
    expect(getExerciseUserRank).toHaveBeenCalledWith("ex1", 40_000);
  });

  it("reports no tempo for an exercise that has none", async () => {
    const result = await saveRun({ score: 21_375, previousBest: 0, activeExercise: untimedExercise });

    expect(result.current.micStandingRef.current).toEqual({ rank: 2 });
  });

  it("reports no place when the leaderboard can't be read", async () => {
    vi.mocked(getExerciseUserRank).mockResolvedValue(null);

    const result = await saveRun({ score: 21_375, previousBest: 0 });

    expect(result.current.micStandingRef.current).toEqual({ bpm: 90 });
  });

  it("leaves no standing behind when nothing was scored", async () => {
    const result = await saveRun({ score: 0, previousBest: 5_000 });

    expect(saveLeaderboardEntry).not.toHaveBeenCalled();
    expect(result.current.micStandingRef.current).toEqual({});
  });
});

describe("useScoreSaving completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getExerciseUserRank).mockResolvedValue(2);
  });

  it("marks the exercise done even when there was nothing to score", async () => {
    // A play-along / improv prompt: mic off, no hunt, no riddle — every scoring
    // branch stays shut, and the completion stamp is the only record of the run.
    const { result } = renderHook(() =>
      useScoreSaving({
        activeExercise: untimedExercise,
        currentExercise: untimedExercise,
        isMicEnabled: false,
        earTrainingScore: 0,
        noteMatchingHandle: handleFor(0),
        sessionBpm: 60,
      })
    );

    await act(async () => {
      await result.current.saveCurrentScores();
    });

    expect(updateMicHighScore).not.toHaveBeenCalled();
    expect(markExerciseCompleted).toHaveBeenCalledWith("me", "ex1", "C Minor Pentatonic", "technique");
  });

  it("still marks it done alongside a saved score", async () => {
    await saveRun({ score: 900, previousBest: 0 });
    expect(markExerciseCompleted).toHaveBeenCalledWith("me", "ex1", "C Minor Pentatonic", "technique");
  });
});
