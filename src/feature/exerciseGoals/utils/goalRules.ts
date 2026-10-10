import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import type {
  ExerciseGoal,
  GoalRunInput,
  GoalRunOutcome,
  GoalStrictness,
} from "../types/exerciseGoal.types";

/** Clean runs at the target tempo that finish a goal. */
export const GOAL_CLEAN_RUNS_REQUIRED = 3;

/**
 * Lowest accuracy a run may have to count as clean. 90 matches the bar the
 * scale tree already sets for its record runs; the other two are the player's
 * choice of a looser or a tighter goal.
 */
export const STRICTNESS_ACCURACY: Record<GoalStrictness, number> = {
  relaxed: 80,
  standard: 90,
  strict: 95,
};

export const GOAL_STRICTNESS_OPTIONS: GoalStrictness[] = [
  "relaxed",
  "standard",
  "strict",
];

export const MIN_GOAL_BPM = 20;
export const MAX_GOAL_BPM = 400;

/**
 * Exercises a goal can be set on: ones the mic can score note by note at a
 * metronome tempo. That is a tab to match against and a tempo to hold it at —
 * hunts, strumming patterns, quizzes and play-alongs score something else, or
 * nothing, and generated drills get a fresh id every time they're built.
 */
export const isGoalEligibleExercise = (exercise: Exercise): boolean =>
  !!exercise.metronomeSpeed &&
  !!exercise.tablature?.length &&
  !exercise.disableMic &&
  !exercise.isPlayalong &&
  !exercise.isHiddenFromLibrary &&
  !exercise.noteHuntConfig &&
  !exercise.strummingPatterns?.length &&
  !exercise.riddleConfig &&
  !exercise.earQuizConfig &&
  !exercise.gpFileUrl &&
  !exercise._generatorConfig;

/** The tempo the create dialog starts from: the top of the exercise's own range. */
export const suggestTargetBpm = (
  exercise: Pick<Exercise, "metronomeSpeed">,
): number => exercise.metronomeSpeed?.max ?? 100;

/** The next goal offered once one is reached: about 10% faster, on a multiple of 5. */
export const raisedTargetBpm = (targetBpm: number): number =>
  Math.min(
    MAX_GOAL_BPM,
    Math.max(targetBpm + 5, Math.round((targetBpm * 1.1) / 5) * 5),
  );

export const clampGoalBpm = (bpm: number): number =>
  Math.min(MAX_GOAL_BPM, Math.max(MIN_GOAL_BPM, Math.round(bpm)));

/** Whether a run met the goal: at the goal's tempo or faster, with few enough misses. */
export const isRunClean = (
  run: GoalRunInput,
  goal: Pick<ExerciseGoal, "targetBpm" | "strictness">,
): boolean =>
  run.bpm >= goal.targetBpm &&
  run.accuracy >= STRICTNESS_ACCURACY[goal.strictness];

/**
 * What a goal-mode run does to its goal. A finished goal stays finished — a
 * run played on it afterwards is judged but changes nothing.
 */
export const applyGoalRun = (
  goal: Pick<
    ExerciseGoal,
    "targetBpm" | "strictness" | "counting" | "cleanRuns" | "status"
  >,
  run: GoalRunInput,
): GoalRunOutcome => {
  const clean = isRunClean(run, goal);
  const reason = clean
    ? "clean"
    : run.bpm < goal.targetBpm
      ? "too_slow"
      : "accuracy";

  if (goal.status !== "active") {
    return {
      clean,
      reason: "goal_closed",
      cleanRuns: goal.cleanRuns,
      justCompleted: false,
      streakReset: false,
    };
  }

  if (clean) {
    const cleanRuns = Math.min(GOAL_CLEAN_RUNS_REQUIRED, goal.cleanRuns + 1);
    return {
      clean,
      reason,
      cleanRuns,
      justCompleted: cleanRuns >= GOAL_CLEAN_RUNS_REQUIRED,
      streakReset: false,
    };
  }

  const streakReset = goal.counting === "streak" && goal.cleanRuns > 0;
  return {
    clean,
    reason,
    cleanRuns: goal.counting === "streak" ? 0 : goal.cleanRuns,
    justCompleted: false,
    streakReset,
  };
};
