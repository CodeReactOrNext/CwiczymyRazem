import type { UserRoadmapSummary } from "feature/supporterPanel/types/userRoadmaps.types";
import { describe, expect, it } from "vitest";

import { buildRoadmapTeaser, TEASER_SIZE } from "./roadmapTeaser";

const row = (
  id: string,
  overrides: Partial<UserRoadmapSummary> = {},
): UserRoadmapSummary => ({
  rowId: `u_${id}`,
  id,
  userId: `owner-${id}`,
  displayName: "Ann",
  avatar: "ann.png",
  // No title, as on roadmaps from before titles were asked for: the goal stands in.
  title: "",
  goal: `Goal ${id}. Beginner level.`,
  level: "Beginner",
  createdAt: "",
  updatedAt: "",
  phaseCount: 5,
  stepCount: 20,
  describedSteps: 20,
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

describe("buildRoadmapTeaser", () => {
  it("leads with what most people follow and practise", () => {
    const teaser = buildRoadmapTeaser([
      row("quiet"),
      row("practised", { sessionsCompleted: 5 }),
      row("followed", { followerCount: 1 }),
    ]);
    expect(teaser.roadmaps.map((item) => item.goal)).toEqual([
      "Goal followed.",
      "Goal practised.",
      "Goal quiet.",
    ]);
  });

  it("carries no names, avatars or ids, and leaves private roadmaps out", () => {
    const teaser = buildRoadmapTeaser([
      row("a"),
      row("b", { visibility: "private" }),
    ]);
    expect(teaser.total).toBe(1);
    expect(teaser.players).toBe(1);
    expect(Object.keys(teaser.roadmaps[0]).sort()).toEqual([
      "followerCount",
      "goal",
      "level",
      "phaseCount",
      "stepCount",
    ]);
  });

  it("caps the window", () => {
    const many = Array.from({ length: 10 }, (_, index) => row(`r${index}`));
    expect(buildRoadmapTeaser(many).roadmaps).toHaveLength(TEASER_SIZE);
  });
});
