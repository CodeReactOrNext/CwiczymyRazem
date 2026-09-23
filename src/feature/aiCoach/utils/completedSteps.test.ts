import { describe, expect, it } from "vitest";

import type { RoadmapPhase } from "../types/roadmap.types";
import { newlyCompletedSteps } from "./completedSteps";

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
