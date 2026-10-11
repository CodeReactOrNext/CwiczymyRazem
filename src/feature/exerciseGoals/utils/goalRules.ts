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

/** Where the path starts by default: the bottom of the exercise's own range. */
export const suggestStartBpm = (
  exercise: Pick<Exercise, "metronomeSpeed">,
): number => exercise.metronomeSpeed?.min ?? 60;

/** The next goal offered once one is reached: about 10% faster, on a multiple of 5. */
export const raisedTargetBpm = (targetBpm: number): number =>
  Math.min(
    MAX_GOAL_BPM,
    Math.max(targetBpm + 5, Math.round((targetBpm * 1.1) / 5) * 5),
  );

export const clampGoalBpm = (bpm: number): number =>
  Math.min(MAX_GOAL_BPM, Math.max(MIN_GOAL_BPM, Math.round(bpm)));

/**
 * The milestones from start to target: the start, then every multiple of the
 * step on the way up, then the target. A multiple within half a step of either
 * end is left out, so no milestone sits a couple of BPM from the next one.
 */
export const goalPath = (
  startBpm: number,
  targetBpm: number,
  stepBpm: number,
): number[] => {
  if (startBpm >= targetBpm || stepBpm <= 0) return [targetBpm];
  const path = [startBpm];
  let next = (Math.floor(startBpm / stepBpm) + 1) * stepBpm;
  if (next - startBpm < stepBpm / 2) next += stepBpm;
  for (; targetBpm - next >= stepBpm / 2; next += stepBpm) path.push(next);
  path.push(targetBpm);
  return path;
};

/** The step of goals set before the step was stored. */
export const DEFAULT_STEP_BPM = 5;

/** Steps a path may take — round numbers, so the milestones read 80 · 85 · 90. */
const PATH_STEPS = [5, 10, 20, 25, 50];
/** Past this many milestones the climb takes a bigger step instead. */
export const MAX_GOAL_STAGES = 16;

/** The smallest round step that keeps the path within MAX_GOAL_STAGES. */
export const autoStepBpm = (startBpm: number, targetBpm: number): number =>
  PATH_STEPS.find(
    (step) => goalPath(startBpm, targetBpm, step).length <= MAX_GOAL_STAGES,
  ) ?? PATH_STEPS[PATH_STEPS.length - 1];

/** The goal's milestones. */
export const goalStages = (
  goal: Pick<ExerciseGoal, "startBpm" | "targetBpm" | "stepBpm">,
): number[] => goalPath(goal.startBpm, goal.targetBpm, goal.stepBpm);

/** The milestone after the given one, or null when it was the last. */
export const nextStageBpm = (
  goal: Pick<ExerciseGoal, "startBpm" | "targetBpm" | "stepBpm">,
  stageBpm: number,
): number | null =>
  stageBpm >= goal.targetBpm
    ? null
    : (goalStages(goal).find((bpm) => bpm > stageBpm) ?? goal.targetBpm);

/** Whether a run met its milestone: at the milestone's tempo or faster, with few enough misses. */
export const isRunClean = (
  run: GoalRunInput,
  goal: Pick<ExerciseGoal, "stageBpm" | "strictness">,
): boolean =>
  run.bpm >= goal.stageBpm &&
  run.accuracy >= STRICTNESS_ACCURACY[goal.strictness];

type JudgedGoal = Pick<
  ExerciseGoal,
  | "startBpm"
  | "targetBpm"
  | "stepBpm"
  | "stageBpm"
  | "strictness"
  | "counting"
  | "cleanRuns"
  | "status"
>;

/**
 * What a goal-mode run does to its goal. A run is judged at the current
 * milestone; the clean runs that fill it move the goal on to the next one, and
 * the ones that fill the last finish the goal. A finished goal stays finished —
 * a run played on it afterwards is judged but changes nothing.
 */
export const applyGoalRun = (
  goal: JudgedGoal,
  run: GoalRunInput,
): GoalRunOutcome => {
  const clean = isRunClean(run, goal);
  const reason = clean
    ? "clean"
    : run.bpm < goal.stageBpm
      ? "too_slow"
      : "accuracy";
  const unchanged = {
    stageBpm: goal.stageBpm,
    stageCleared: false,
    nextStageBpm: goal.status === "active" ? goal.stageBpm : null,
    justCompleted: false,
    streakReset: false,
  };

  if (goal.status !== "active") {
    return {
      ...unchanged,
      clean,
      reason: "goal_closed",
      cleanRuns: goal.cleanRuns,
    };
  }

  if (clean) {
    const cleanRuns = Math.min(GOAL_CLEAN_RUNS_REQUIRED, goal.cleanRuns + 1);
    if (cleanRuns < GOAL_CLEAN_RUNS_REQUIRED) {
      return { ...unchanged, clean, reason, cleanRuns };
    }
    const next = nextStageBpm(goal, goal.stageBpm);
    return {
      ...unchanged,
      clean,
      reason,
      cleanRuns,
      stageCleared: true,
      nextStageBpm: next,
      justCompleted: next === null,
    };
  }

  return {
    ...unchanged,
    clean,
    reason,
    cleanRuns: goal.counting === "streak" ? 0 : goal.cleanRuns,
    streakReset: goal.counting === "streak" && goal.cleanRuns > 0,
  };
};
