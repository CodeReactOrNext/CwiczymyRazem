// @vitest-environment jsdom
import type * as ReactQuery from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseUpdateUserProgress = vi.fn();
vi.mock("feature/aiCoach/services/userProgress.service", () => ({
  firebaseUpdateUserProgress: (...args: unknown[]) =>
    firebaseUpdateUserProgress(...args),
}));

const firebaseAddRoadmapStepLog = vi.fn();
vi.mock("feature/logs/services/addRoadmapStepLog.service", () => ({
  firebaseAddRoadmapStepLog: (...args: unknown[]) =>
    firebaseAddRoadmapStepLog(...args),
}));

const setQueryData = vi.fn();
const getQueryData = vi.fn();
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof ReactQuery>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQueryClient: () => ({ setQueryData, getQueryData }),
  };
});

const { useOwnRoadmapPersist } = await import("./useOwnRoadmapPersist");
const { USER_ROADMAPS_KEY } = await import("./useUserRoadmaps");

const phases: RoadmapPhase[] = [
  {
    id: "p1",
    title: "Phase 1",
    order: 0,
    steps: [
      {
        id: "s1",
        title: "Step 1",
        description: "",
        successCriteria: "",
        sessionsRequired: 8,
        sessionsCompleted: 4,
        order: 0,
        exerciseCompleted: true,
        completedLessonIds: ["yt-1"],
      },
    ],
  },
];

/** The cached detail: the same step, with `saved` sessions at the last save. */
const cachedDetail = (saved: number) => ({
  summary: { id: "r1", title: "Shred plan", goal: "" },
  roadmap: {
    id: "r1",
    phases: phases.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) => ({ ...step, sessionsCompleted: 0 })),
    })),
  },
  stepProgress: { s1: saved },
  resourceProgress: {},
  phaseChecks: {},
});

const finishedPhases: RoadmapPhase[] = phases.map((phase) => ({
  ...phase,
  steps: phase.steps.map((step) => ({ ...step, sessionsCompleted: 8 })),
}));

beforeEach(() => {
  firebaseUpdateUserProgress.mockReset();
  firebaseAddRoadmapStepLog.mockReset();
  setQueryData.mockReset();
  getQueryData.mockReset();
});

describe("useOwnRoadmapPersist", () => {
  it("writes the extracted progress under the player's own uid and roadmap id", async () => {
    const { result } = renderHook(() => useOwnRoadmapPersist("u1", "r1"));

    await result.current(phases);

    expect(firebaseUpdateUserProgress).toHaveBeenCalledWith(
      "u1",
      "r1",
      { s1: 4 },
      {
        s1: {
          exerciseCompleted: true,
          completedLessonIds: ["yt-1"],
          songCompleted: false,
        },
      },
      {},
    );
  });

  it("updates the cached detail so a re-render sees the fresh progress without a refetch", async () => {
    const { result } = renderHook(() => useOwnRoadmapPersist("u1", "r1"));

    await result.current(phases);

    expect(setQueryData).toHaveBeenCalledWith(
      [...USER_ROADMAPS_KEY, "detail", "u1", "r1"],
      expect.any(Function),
    );
    const updater = setQueryData.mock.calls[0][1] as (prev: unknown) => unknown;
    expect(updater({ stepProgress: {}, other: "kept" })).toEqual({
      stepProgress: { s1: 4 },
      resourceProgress: {
        s1: {
          exerciseCompleted: true,
          completedLessonIds: ["yt-1"],
          songCompleted: false,
        },
      },
      phaseChecks: {},
      other: "kept",
    });
    // Nothing to merge into when the detail was never fetched.
    expect(updater(undefined)).toBeUndefined();
  });

  it("puts a step that just crossed into done in the runner's activity log", async () => {
    getQueryData.mockReturnValue(cachedDetail(4));
    const { result } = renderHook(() =>
      useOwnRoadmapPersist("owner", "r1", "follower"),
    );

    await result.current(finishedPhases);
    // Ticked off again in the same visit: still one feed row.
    await result.current(finishedPhases);

    expect(firebaseAddRoadmapStepLog).toHaveBeenCalledTimes(1);
    expect(firebaseAddRoadmapStepLog).toHaveBeenCalledWith("follower", {
      roadmapId: "r1",
      roadmapTitle: "Shred plan",
      phaseTitle: "Phase 1",
      stepId: "s1",
      stepTitle: "Step 1",
    });
  });

  it("logs nothing for a step that was already done at the last save", async () => {
    getQueryData.mockReturnValue(cachedDetail(8));
    const { result } = renderHook(() => useOwnRoadmapPersist("u1", "r1"));

    await result.current(finishedPhases);

    expect(firebaseAddRoadmapStepLog).not.toHaveBeenCalled();
  });
});
