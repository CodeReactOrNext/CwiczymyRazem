import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { ExerciseGoal } from "../types/exerciseGoal.types";
import {
  applyGoalRun,
  clampGoalBpm,
  GOAL_CLEAN_RUNS_REQUIRED,
  isGoalEligibleExercise,
  isRunClean,
  raisedTargetBpm,
  STRICTNESS_ACCURACY,
} from "./goalRules";

const goal = (overrides: Partial<ExerciseGoal> = {}): ExerciseGoal => ({
  id: "g1",
  exerciseId: "ex",
  exerciseTitle: "Exercise",
  targetBpm: 115,
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
