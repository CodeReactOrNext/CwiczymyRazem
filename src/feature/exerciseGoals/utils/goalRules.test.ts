import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { ExerciseGoal } from "../types/exerciseGoal.types";
import {
  applyGoalRun,
  autoStepBpm,
  clampGoalBpm,
  GOAL_CLEAN_RUNS_REQUIRED,
  goalPath,
  isGoalEligibleExercise,
  isRunClean,
  MAX_GOAL_STAGES,
  nextStageBpm,
  raisedTargetBpm,
  STRICTNESS_ACCURACY,
} from "./goalRules";

const goal = (overrides: Partial<ExerciseGoal> = {}): ExerciseGoal => ({
  id: "g1",
  exerciseId: "ex",
  exerciseTitle: "Exercise",
  targetBpm: 115,
  startBpm: 115,
  stepBpm: 5,
  stageBpm: 115,
  strictness: "standard",
  counting: "streak",
  cleanRuns: 0,
  status: "active",
  createdAt: 0,
  completedAt: null,
  ...overrides,
});

describe("isRunClean", () => {
  it("needs both the tempo and the accuracy", () => {
    expect(isRunClean({ bpm: 115, accuracy: 92 }, goal())).toBe(true);
    expect(isRunClean({ bpm: 120, accuracy: 90 }, goal())).toBe(true);
    expect(isRunClean({ bpm: 114, accuracy: 100 }, goal())).toBe(false);
    expect(isRunClean({ bpm: 115, accuracy: 89 }, goal())).toBe(false);
  });

  it("reads the accuracy bar off the goal's strictness", () => {
    expect(
      isRunClean({ bpm: 115, accuracy: 82 }, goal({ strictness: "relaxed" })),
    ).toBe(true);
    expect(
      isRunClean({ bpm: 115, accuracy: 94 }, goal({ strictness: "strict" })),
    ).toBe(false);
    expect(
      isRunClean(
        { bpm: 115, accuracy: STRICTNESS_ACCURACY.strict },
        goal({ strictness: "strict" }),
      ),
    ).toBe(true);
  });
});

describe("applyGoalRun", () => {
  it("counts a clean run", () => {
    const outcome = applyGoalRun(goal({ cleanRuns: 1 }), {
      bpm: 115,
      accuracy: 95,
    });
    expect(outcome).toMatchObject({
      clean: true,
      reason: "clean",
      cleanRuns: 2,
      justCompleted: false,
    });
  });

  it("finishes the goal on the last clean run", () => {
    const outcome = applyGoalRun(
      goal({ cleanRuns: GOAL_CLEAN_RUNS_REQUIRED - 1 }),
      { bpm: 115, accuracy: 95 },
    );
    expect(outcome).toMatchObject({
      cleanRuns: GOAL_CLEAN_RUNS_REQUIRED,
      justCompleted: true,
    });
  });

  it("starts a streak over after a run that isn't clean", () => {
    const outcome = applyGoalRun(goal({ cleanRuns: 2 }), {
      bpm: 115,
      accuracy: 70,
    });
    expect(outcome).toMatchObject({
      clean: false,
      reason: "accuracy",
      cleanRuns: 0,
      streakReset: true,
    });
  });

  it("keeps a total's count through a run that isn't clean", () => {
    const outcome = applyGoalRun(goal({ cleanRuns: 2, counting: "total" }), {
      bpm: 100,
      accuracy: 99,
    });
    expect(outcome).toMatchObject({
      clean: false,
      reason: "too_slow",
      cleanRuns: 2,
      streakReset: false,
    });
  });

  it("doesn't report a reset when there was nothing to lose", () => {
    expect(applyGoalRun(goal(), { bpm: 115, accuracy: 10 }).streakReset).toBe(
      false,
    );
  });

  it("leaves a finished goal as it was", () => {
    const outcome = applyGoalRun(goal({ status: "completed", cleanRuns: 3 }), {
      bpm: 130,
      accuracy: 100,
    });
    expect(outcome).toMatchObject({
      clean: true,
      reason: "goal_closed",
      cleanRuns: 3,
      justCompleted: false,
    });
  });
});

describe("goalPath", () => {
  it("climbs in even steps from start to target", () => {
    expect(goalPath(80, 120, 5)).toEqual([
      80, 85, 90, 95, 100, 105, 110, 115, 120,
    ]);
  });

  it("is a single milestone when start and target meet", () => {
    expect(goalPath(120, 120, 5)).toEqual([120]);
    expect(goalPath(130, 120, 5)).toEqual([120]);
  });

  it("snaps the milestones between the ends to round numbers", () => {
    expect(goalPath(82, 100, 5)).toEqual([82, 85, 90, 95, 100]);
  });

  it("drops a round number that would sit right next to an end", () => {
    expect(goalPath(84, 100, 5)).toEqual([84, 90, 95, 100]);
    expect(goalPath(80, 122, 5)).toEqual([
      80, 85, 90, 95, 100, 105, 110, 115, 122,
    ]);
  });
});

describe("autoStepBpm", () => {
  it("steps by five while the path stays short", () => {
    expect(autoStepBpm(80, 120)).toBe(5);
  });

  it("takes bigger steps over a long climb", () => {
    const step = autoStepBpm(60, 240);
    expect(step).toBeGreaterThan(5);
    expect(goalPath(60, 240, step).length).toBeLessThanOrEqual(MAX_GOAL_STAGES);
  });
});

describe("nextStageBpm", () => {
  const path = { startBpm: 80, targetBpm: 100, stepBpm: 10 };

  it("walks the path one milestone at a time", () => {
    expect(nextStageBpm(path, 80)).toBe(90);
    expect(nextStageBpm(path, 90)).toBe(100);
  });

  it("ends at the target", () => {
    expect(nextStageBpm(path, 100)).toBeNull();
  });
});

describe("applyGoalRun on a path", () => {
  const onPath = (overrides: Partial<ExerciseGoal> = {}) =>
    goal({
      startBpm: 80,
      stepBpm: 5,
      targetBpm: 90,
      stageBpm: 80,
      ...overrides,
    });

  it("judges a run at the current milestone, not the target", () => {
    expect(applyGoalRun(onPath(), { bpm: 82, accuracy: 95 })).toMatchObject({
      clean: true,
      stageBpm: 80,
      cleanRuns: 1,
      stageCleared: false,
      nextStageBpm: 80,
    });
  });

  it("moves on to the next milestone after its clean runs", () => {
    const outcome = applyGoalRun(
      onPath({ cleanRuns: GOAL_CLEAN_RUNS_REQUIRED - 1 }),
      { bpm: 80, accuracy: 95 },
    );
    expect(outcome).toMatchObject({
      stageCleared: true,
      cleanRuns: GOAL_CLEAN_RUNS_REQUIRED,
      nextStageBpm: 85,
      justCompleted: false,
    });
  });

  it("finishes the goal on the last milestone", () => {
    const outcome = applyGoalRun(
      onPath({ stageBpm: 90, cleanRuns: GOAL_CLEAN_RUNS_REQUIRED - 1 }),
      { bpm: 90, accuracy: 95 },
    );
    expect(outcome).toMatchObject({
      stageCleared: true,
      nextStageBpm: null,
      justCompleted: true,
    });
  });

  it("calls a run under the milestone too slow", () => {
    expect(
      applyGoalRun(onPath({ stageBpm: 85 }), { bpm: 82, accuracy: 99 }),
    ).toMatchObject({ clean: false, reason: "too_slow", stageBpm: 85 });
  });
});

describe("raisedTargetBpm", () => {
  it("offers about 10% more, on a multiple of five", () => {
    expect(raisedTargetBpm(100)).toBe(110);
    expect(raisedTargetBpm(115)).toBe(125);
  });

  it("always raises by at least five", () => {
    expect(raisedTargetBpm(30)).toBe(35);
  });

  it("stays inside the allowed range", () => {
    expect(raisedTargetBpm(400)).toBe(400);
    expect(clampGoalBpm(5)).toBe(20);
  });
});

describe("isGoalEligibleExercise", () => {
  const base = exercisesAgregat.find(isGoalEligibleExercise) as Exercise;

  it("accepts a metronome tab drill", () => {
    expect(base).toBeDefined();
  });

  it("turns down what the mic can't score note by note", () => {
    expect(isGoalEligibleExercise({ ...base, metronomeSpeed: null })).toBe(
      false,
    );
    expect(isGoalEligibleExercise({ ...base, tablature: [] })).toBe(false);
    expect(isGoalEligibleExercise({ ...base, disableMic: true })).toBe(false);
    expect(
      isGoalEligibleExercise({
        ...base,
        noteHuntConfig: { rotateSeconds: 10 },
      }),
    ).toBe(false);
  });
});
