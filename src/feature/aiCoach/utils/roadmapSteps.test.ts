import { describe, expect, it } from "vitest";

import type { RoadmapPhase, RoadmapStep } from "../types/roadmap.types";
import {
  findRoadmapStep,
  flattenRoadmapSteps,
  getNextUnfinishedStep,
} from "./roadmapSteps";

const step = (id: string, sessionsCompleted = 0): RoadmapStep => ({
  id,
  title: id,
  description: "",
  successCriteria: "",
  sessionsRequired: 4,
  sessionsCompleted,
  order: 0,
});

const phases: RoadmapPhase[] = [
  { id: "p1", title: "Basics", order: 0, steps: [step("a"), step("b")] },
  { id: "p2", title: "Rhythm", order: 1, steps: [step("c")] },
];

describe("flattenRoadmapSteps", () => {
  it("walks phases in order and numbers steps both locally and globally", () => {
    const flat = flattenRoadmapSteps(phases);
    expect(flat.map((r) => r.step.id)).toEqual(["a", "b", "c"]);
    expect(flat.map((r) => r.index)).toEqual([0, 1, 2]);
    expect(flat[2]).toMatchObject({
      phaseIdx: 1,
      stepIdx: 0,
      phase: phases[1],
    });
  });
});

describe("findRoadmapStep", () => {
  const flat = flattenRoadmapSteps(phases);

  it("finds a step by id", () => {
    expect(findRoadmapStep(flat, "b")?.index).toBe(1);
  });

  it("is null for an unknown or missing id", () => {
    expect(findRoadmapStep(flat, "nope")).toBeNull();
    expect(findRoadmapStep(flat, null)).toBeNull();
    expect(findRoadmapStep(flat, undefined)).toBeNull();
  });
});

describe("getNextUnfinishedStep", () => {
  it("starts at the first step of a fresh roadmap", () => {
    expect(getNextUnfinishedStep(flattenRoadmapSteps(phases))?.step.id).toBe(
      "a",
    );
  });

  it("skips finished steps", () => {
    const flat = flattenRoadmapSteps([
      { ...phases[0], steps: [step("a", 4), step("b")] },
      phases[1],
    ]);
    expect(getNextUnfinishedStep(flat)?.step.id).toBe("b");
  });

  it("prefers a step already in progress over an earlier untouched one", () => {
    const flat = flattenRoadmapSteps([
      { ...phases[0], steps: [step("a"), step("b")] },
      { ...phases[1], steps: [step("c", 1)] },
    ]);
    expect(getNextUnfinishedStep(flat)?.step.id).toBe("c");
  });

  it("is null once everything is done", () => {
    const flat = flattenRoadmapSteps([
      { ...phases[0], steps: [step("a", 4), step("b", 4)] },
      { ...phases[1], steps: [step("c", 4)] },
    ]);
    expect(getNextUnfinishedStep(flat)).toBeNull();
  });
});
