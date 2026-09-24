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

const setQueryData = vi.fn();
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof ReactQuery>(
    "@tanstack/react-query",
  );
  return { ...actual, useQueryClient: () => ({ setQueryData }) };
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

beforeEach(() => {
  firebaseUpdateUserProgress.mockReset();
  setQueryData.mockReset();
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
});
