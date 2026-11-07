import type {
  JourneyModule,
  JourneyProgressDocument,
  JourneyStep,
  JourneyStepProgress,
} from "feature/journey/types/journey.types";
import { describe, expect, it } from "vitest";

import {
  buildModuleWithStatus,
  getNextJourneyStep,
  mergeStepsWithProgress,
} from "./journeyStatus";

const step = (id: string, order: number): JourneyStep => ({
  id,
  order,
  stageId: "stage_1",
  title: id,
  shortDescription: "",
  fullDescription: "",
  tips: [],
  commonMistakes: [],
  examGoal: "",
  suggestedExerciseId: "",
  stepIcon: "Music",
});

const mod = (id: string, stepIds: string[], locked = false): JourneyModule => ({
  id,
  title: id,
  subtitle: "",
  locked,
  icon: "Music",
  stages: [
    { id: "stage_1", order: 1, steps: stepIds.map((s, i) => step(s, i + 1)) },
  ],
});

const doc = (
  moduleProgress: Record<string, Record<string, JourneyStepProgress>>
): JourneyProgressDocument => ({
  userId: "u",
  updatedAt: "",
  moduleProgress: Object.fromEntries(
    Object.entries(moduleProgress).map(([id, steps]) => [id, { steps }])
  ),
});

const done: JourneyStepProgress = { completed: true, stars: 3 };
const started: JourneyStepProgress = { completed: false, startedAt: "2026-11-01" };

describe("mergeStepsWithProgress", () => {
  it("opens the first step and locks the rest when nothing is saved", () => {
    const steps = mergeStepsWithProgress([step("a", 1), step("b", 2)], undefined);
    expect(steps.map((s) => s.status)).toEqual(["available", "locked"]);
  });

  it("opens the step after a completed one and keeps its stars", () => {
    const steps = mergeStepsWithProgress([step("a", 1), step("b", 2), step("c", 3)], {
      a: done,
    });
    expect(steps.map((s) => s.status)).toEqual(["completed", "available", "locked"]);
    expect(steps[0].stars).toBe(3);
  });

  it("marks a started, unfinished step as in progress", () => {
    const steps = mergeStepsWithProgress([step("a", 1), step("b", 2)], {
      a: done,
      b: started,
    });
    expect(steps[1].status).toBe("in-progress");
  });
});

describe("buildModuleWithStatus", () => {
  it("counts completed steps against the total", () => {
    const built = buildModuleWithStatus(
      mod("m", ["a", "b", "c"]),
      doc({ m: { a: done, b: done } })
    );
    expect(built.completedCount).toBe(2);
    expect(built.totalCount).toBe(3);
  });
});

describe("getNextJourneyStep", () => {
  const build = (
    modules: JourneyModule[],
    progress: Parameters<typeof doc>[0] = {}
  ) => modules.map((m) => buildModuleWithStatus(m, doc(progress)));

  it("starts a new player at the first step of the first module", () => {
    const next = getNextJourneyStep(build([mod("m1", ["a", "b"]), mod("m2", ["x"])]));
    expect(next?.module.id).toBe("m1");
    expect(next?.step.id).toBe("a");
  });

  it("prefers a started step over an open one", () => {
    const next = getNextJourneyStep(
      build([mod("m1", ["a", "b"]), mod("m2", ["x", "y"])], {
        m1: { a: done },
        m2: { x: started },
      })
    );
    expect(next?.step.id).toBe("x");
  });

  it("finishes a begun module before opening an untouched one", () => {
    const next = getNextJourneyStep(
      build([mod("m1", ["a"]), mod("m2", ["x", "y"])], { m2: { x: done } })
    );
    expect(next?.module.id).toBe("m2");
    expect(next?.step.id).toBe("y");
  });

  it("skips locked and finished modules", () => {
    const next = getNextJourneyStep(
      build([mod("m1", ["a"]), mod("m2", ["x"], true), mod("m3", ["z"])], {
        m1: { a: done },
      })
    );
    expect(next?.module.id).toBe("m3");
  });

  it("returns null when everything is done", () => {
    expect(
      getNextJourneyStep(build([mod("m1", ["a"])], { m1: { a: done } }))
    ).toBeNull();
  });
});
