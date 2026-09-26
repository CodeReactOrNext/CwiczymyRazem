import type { Roadmap } from "feature/aiCoach/types/roadmap.types";
import { describe, expect, it } from "vitest";

import { repairFollowerProgress } from "./followerProgressRepair";

const ownerCheck = {
  passedAt: "2026-08-01T10:00:00.000Z",
  attempts: 2,
  bestScore: 5,
  total: 5,
};

const roadmap = {
  id: "r1",
  userId: "owner",
  phases: [
    {
      id: "p1",
      check: ownerCheck,
      steps: [
        { id: "s1", sessionsCompleted: 3, sessionsRequired: 3 },
        { id: "s2", sessionsCompleted: 1, sessionsRequired: 3 },
        { id: "s3", sessionsCompleted: 0, sessionsRequired: 3 },
      ],
    },
  ],
} as unknown as Roadmap;

describe("repairFollowerProgress", () => {
  it("leaves the owner's own document alone", () => {
    expect(
      repairFollowerProgress(roadmap, {
        roadmapId: "r1",
        userId: "owner",
        stepProgress: { s1: 3 },
      }),
    ).toBeNull();
  });

  it("zeroes counts and drops checkpoints copied from the owner", () => {
    const repair = repairFollowerProgress(roadmap, {
      roadmapId: "r1",
      userId: "follower",
      stepProgress: { s1: 3, s2: 1, s3: 1 },
      phaseChecks: { p1: { ...ownerCheck } },
    });

    expect(repair).toEqual({
      stepProgress: { s1: 0, s2: 0, s3: 1 },
      phaseChecks: {},
      clearedSteps: ["s1", "s2"],
      clearedPhases: ["p1"],
    });
  });

  it("keeps a matching count the follower ticked resources for", () => {
    const repair = repairFollowerProgress(roadmap, {
      roadmapId: "r1",
      userId: "follower",
      stepProgress: { s1: 3, s2: 1 },
      resourceProgress: { s1: { exerciseCompleted: true } },
    });

    expect(repair?.stepProgress).toEqual({ s1: 3, s2: 0 });
    expect(repair?.clearedSteps).toEqual(["s2"]);
  });

  it("keeps the follower's own checkpoint result and differing counts", () => {
    expect(
      repairFollowerProgress(roadmap, {
        roadmapId: "r1",
        userId: "follower",
        stepProgress: { s1: 1, s2: 3 },
        phaseChecks: { p1: { ...ownerCheck, attempts: 1 } },
      }),
    ).toBeNull();
  });
});
