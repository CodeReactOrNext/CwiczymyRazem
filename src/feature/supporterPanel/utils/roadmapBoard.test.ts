import type { UserRoadmapSummary } from "feature/supporterPanel/types/userRoadmaps.types";
import { describe, expect, it } from "vitest";

import { arrangeRoadmaps } from "./roadmapBoard";

const row = (
  id: string,
  overrides: Partial<UserRoadmapSummary> = {},
): UserRoadmapSummary => ({
  rowId: `u_${id}`,
  id,
  userId: "u",
  displayName: null,
  avatar: null,
  title: id,
  goal: id,
  level: "Beginner",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  phaseCount: 1,
  stepCount: 1,
  describedSteps: 1,
  exerciseSteps: 0,
  songSteps: 0,
  lessonSteps: 0,
  completedSteps: 0,
  sessionsCompleted: 0,
  lastPractisedAt: null,
  checkpointsPassed: 0,
  visibility: "public",
  followerCount: 0,
  viewerProgress: null,
  ...overrides,
});

const board = [
  row("old-busy", {
    createdAt: "2026-01-01",
    updatedAt: "2026-05-01",
    sessionsCompleted: 9,
  }),
  row("new-quiet", {
    createdAt: "2026-04-01",
    updatedAt: "2026-04-01",
    level: "Advanced",
  }),
  row("followed", {
    createdAt: "2026-02-01",
    updatedAt: "2026-02-01",
    followerCount: 3,
  }),
];

const ids = (list: UserRoadmapSummary[]) => list.map((summary) => summary.id);

describe("arrangeRoadmaps", () => {
  it("sorts by the chosen order", () => {
    expect(
      ids(arrangeRoadmaps(board, { level: "all", sort: "recent" })),
    ).toEqual(["old-busy", "new-quiet", "followed"]);
    expect(
      ids(arrangeRoadmaps(board, { level: "all", sort: "newest" })),
    ).toEqual(["new-quiet", "followed", "old-busy"]);
    expect(
      ids(arrangeRoadmaps(board, { level: "all", sort: "practised" }))[0],
    ).toBe("old-busy");
    expect(
      ids(arrangeRoadmaps(board, { level: "all", sort: "followed" }))[0],
    ).toBe("followed");
  });

  it("keeps one level only", () => {
    expect(
      ids(arrangeRoadmaps(board, { level: "Advanced", sort: "recent" })),
    ).toEqual(["new-quiet"]);
  });

  it("never reorders the list it was given", () => {
    const copy = [...board];
    arrangeRoadmaps(board, { level: "all", sort: "newest" });
    expect(board).toEqual(copy);
  });
});
