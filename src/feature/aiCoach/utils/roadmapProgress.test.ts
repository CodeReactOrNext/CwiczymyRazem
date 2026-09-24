import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { describe, expect, it } from "vitest";

import { extractStepProgress } from "./roadmapProgress";

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
        sessionsCompleted: 3,
        order: 0,
        exerciseCompleted: true,
        completedLessonIds: ["abc"],
      },
      {
        id: "s2",
        title: "Step 2",
        description: "",
        successCriteria: "",
        sessionsRequired: 8,
        sessionsCompleted: 0,
        order: 1,
      },
    ],
  },
  {
    id: "p2",
    title: "Phase 2",
    order: 1,
    steps: [
      {
        id: "s3",
        title: "Step 3",
        description: "",
        successCriteria: "",
        sessionsRequired: 8,
        sessionsCompleted: 5,
        order: 0,
      },
    ],
  },
];

describe("extractStepProgress", () => {
  it("pulls sessions and resource state off every step, across every phase", () => {
    const { stepProgress, resourceProgress } = extractStepProgress(phases);

    expect(stepProgress).toEqual({ s1: 3, s2: 0, s3: 5 });
    expect(resourceProgress.s1).toStrictEqual({
      exerciseCompleted: true,
      completedLessonIds: ["abc"],
      songCompleted: false,
    });
    expect(resourceProgress.s2).toStrictEqual({
      exerciseCompleted: false,
      completedLessonIds: [],
      songCompleted: false,
    });
  });

  // A generated roadmap's steps carry no ticks until one is made, and
  // Firestore rejects the whole write over a single `undefined`.
  it("never hands Firestore an undefined value", () => {
    const { stepProgress, resourceProgress } = extractStepProgress(phases);
    const values = [
      ...Object.values(stepProgress),
      ...Object.values(resourceProgress).flatMap((r) => Object.values(r)),
    ];

    expect(values).not.toContain(undefined);
  });

  it("returns empty maps for a roadmap with no steps", () => {
    expect(extractStepProgress([])).toEqual({
      stepProgress: {},
      resourceProgress: {},
      phaseChecks: {},
    });
  });
});
