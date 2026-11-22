import { describe, expect, it } from "vitest";

import type { RoadmapPhase, RoadmapStep } from "../../../types/roadmap.types";
import { buildRoadmapLessonPages } from "./RoadmapStepLesson";
import type { StepDrawerView } from "./StepDrawer";

const makeView = (
  step: Partial<RoadmapStep>,
  flags: Partial<Pick<StepDrawerView, "isGenerating" | "detailFailed">> = {},
): StepDrawerView => {
  const full: RoadmapStep = {
    id: "s1",
    title: "Bend a whole tone",
    description: "",
    successCriteria: "",
    sessionsRequired: 3,
    sessionsCompleted: 0,
    order: 1,
    ...step,
  };
  const phase: RoadmapPhase = {
    id: "p1",
    title: "Phrasing",
    order: 1,
    steps: [full],
  };
  return {
    current: { step: full, phase, stepIdx: 0, phaseIdx: 0, index: 0 },
    prev: null,
    next: null,
    lessons: [],
    isGenerating: false,
    detailFailed: false,
    loadingLessons: false,
    loadingExercise: false,
    ...flags,
  };
};

describe("buildRoadmapLessonPages", () => {
  it("gives each description block a page, then the goal, then the kit", () => {
    const pages = buildRoadmapLessonPages(
      makeView({
        description:
          "[What it is] Pushing the string up a whole tone.\n[How to practice] Fret the 7th. Push with three fingers.",
        successCriteria: "Five clean bends in a row.",
      }),
    );
    expect(pages.map((p) => p.kind)).toEqual([
      "section",
      "section",
      "goal",
      "finish",
    ]);
  });

  it("skips the goal page when the step has no success criteria", () => {
    const pages = buildRoadmapLessonPages(
      makeView({ description: "[What it is] A bend." }),
    );
    expect(pages.map((p) => p.kind)).toEqual(["section", "finish"]);
  });

  it("keeps the kit reachable while the copy is still being written", () => {
    const pages = buildRoadmapLessonPages(makeView({}, { isGenerating: true }));
    expect(pages.map((p) => p.kind)).toEqual(["generating", "finish"]);
  });

  it("says the copy failed instead of showing an empty page", () => {
    const pages = buildRoadmapLessonPages(makeView({}, { detailFailed: true }));
    expect(pages.map((p) => p.kind)).toEqual(["failed", "finish"]);
  });
});
