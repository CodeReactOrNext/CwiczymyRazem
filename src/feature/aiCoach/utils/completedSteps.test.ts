import { describe, expect, it } from "vitest";

import type { RoadmapPhase } from "../types/roadmap.types";
import { hasAdvancedStep, newlyCompletedSteps } from "./completedSteps";

const phases = (sessions: Record<string, number>): RoadmapPhase[] => [
  {
    id: "p1",
    title: "Picking",
    order: 0,
    steps: ["s1", "s2"].map((id, order) => ({
      id,
      title: `Step ${id}`,
      description: "",
      successCriteria: "",
      sessionsRequired: 2,
      sessionsCompleted: sessions[id] ?? 0,
      order,
    })),
  },
  {
    id: "p2",
    title: "Legato",
    order: 1,
    steps: [
      {
        id: "s3",
        title: "Step s3",
        description: "",
        successCriteria: "",
        sessionsRequired: 1,
        sessionsCompleted: sessions.s3 ?? 0,
        order: 0,
      },
    ],
  },
];

describe("newlyCompletedSteps", () => {
  it("returns the steps that just crossed into done, with their phase", () => {
    const done = newlyCompletedSteps(
      phases({ s1: 1 }),
      phases({ s1: 2, s3: 1 }),
    );
    expect(done.map(({ step, phase }) => [step.id, phase.title])).toEqual([
      ["s1", "Picking"],
      ["s3", "Legato"],
    ]);
  });

  it("ignores steps that were already done or only moved forward a session", () => {
    expect(
      newlyCompletedSteps(phases({ s1: 2, s2: 0 }), phases({ s1: 3, s2: 1 })),
    ).toEqual([]);
  });

  it("does not count a step that was un-done", () => {
    expect(newlyCompletedSteps(phases({ s1: 2 }), phases({ s1: 0 }))).toEqual(
      [],
    );
  });
});

describe("hasAdvancedStep", () => {
  const withStep = (
    base: RoadmapPhase[],
    stepId: string,
    patch: Partial<RoadmapPhase["steps"][number]>,
  ): RoadmapPhase[] =>
    base.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) =>
        step.id === stepId ? { ...step, ...patch } : step,
      ),
    }));

  it("counts a session more on a step", () => {
    expect(hasAdvancedStep(phases({ s1: 0 }), phases({ s1: 1 }))).toBe(true);
  });

  it("counts a lesson ticked off on a step already in progress", () => {
    const before = withStep(phases({ s1: 1 }), "s1", {
      completedLessonIds: ["yt-1"],
    });
    const after = withStep(phases({ s1: 1 }), "s1", {
      completedLessonIds: ["yt-1", "yt-2"],
    });
    expect(hasAdvancedStep(before, after)).toBe(true);
  });

  it("counts the step's exercise or song ticked off", () => {
    expect(
      hasAdvancedStep(
        phases({ s1: 1 }),
        withStep(phases({ s1: 1 }), "s1", { exerciseCompleted: true }),
      ),
    ).toBe(true);
    expect(
      hasAdvancedStep(
        phases({ s1: 1 }),
        withStep(phases({ s1: 1 }), "s1", { songCompleted: true }),
      ),
    ).toBe(true);
  });

  it("does not count unticking or an unchanged map", () => {
    const ticked = withStep(phases({ s1: 1 }), "s1", {
      exerciseCompleted: true,
      completedLessonIds: ["yt-1"],
    });
    expect(hasAdvancedStep(ticked, phases({ s1: 0 }))).toBe(false);
    expect(hasAdvancedStep(ticked, ticked)).toBe(false);
  });
});
