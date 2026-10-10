/**
 * How many wrong notes a run may have and still count — picked by the player
 * when the goal is set, see STRICTNESS_ACCURACY.
 */
export type GoalStrictness = "relaxed" | "standard" | "strict";

/**
 * How the clean runs add up to a finished goal.
 * - "streak": in a row — a run that isn't clean starts the count over.
 * - "total": any clean runs count, however many misses sit between them.
 */
export type GoalCounting = "streak" | "total";

export type GoalStatus = "active" | "completed";

/** A tempo the player set for one exercise, and how far they are toward it. */
export interface ExerciseGoal {
  id: string;
  exerciseId: string;
  /** Kept on the goal so the feed and the history read without the exercise bundle. */
  exerciseTitle: string;
  targetBpm: number;
  strictness: GoalStrictness;
  counting: GoalCounting;
  /** Clean runs counted toward the goal so far, 0 to GOAL_CLEAN_RUNS_REQUIRED. */
  cleanRuns: number;
  status: GoalStatus;
  /** Epoch ms. */
  createdAt: number;
  /** Epoch ms; null while the goal is still open. */
  completedAt: number | null;
}

export interface NewExerciseGoal {
  exerciseId: string;
  exerciseTitle: string;
  targetBpm: number;
  strictness: GoalStrictness;
  counting: GoalCounting;
}

/**
 * Where a run was played. Only goal-mode runs can finish a goal; practice runs
 * are there to draw the way up to it.
 */
export type ExerciseRunSource = "goal" | "practice";

/** One scored play-through of an exercise, as the goal chart draws it. */
export interface ExerciseRun {
  id: string;
  exerciseId: string;
  /** The slowest tempo a note was scored at in the run — the tempo it earned. */
  bpm: number;
  /** Notes hit out of notes due, 0–100. */
  accuracy: number;
  source: ExerciseRunSource;
  goalId: string | null;
  /** Whether a goal run met its goal; null for practice runs. */
  clean: boolean | null;
  /** Epoch ms. */
  createdAt: number;
  /** Typical distance of the run's notes from the beat, ms (lower is tighter);
   *  null when the run wasn't timed — older runs, sessions read from the log. */
  timingOffsetMs: number | null;
  /** Where the run's notes leaned, ms: negative = ahead of the beat. */
  timingBiasMs: number | null;
}

/** The score of one finished run, the part a goal is judged on. */
export interface GoalRunInput {
  bpm: number;
  accuracy: number;
}

/** How tightly a run sat on the beat — stored with it for the timing chart. */
export interface RunTiming {
  medianOffsetMs: number;
  biasMs: number;
}

/** Why a goal run did or didn't count. */
export type GoalRunVerdictReason =
  | "clean"
  | "too_slow"
  | "accuracy"
  | "goal_closed";

/** What one goal run did to its goal. */
export interface GoalRunOutcome {
  clean: boolean;
  reason: GoalRunVerdictReason;
  /** The goal's count after this run. */
  cleanRuns: number;
  /** The goal was finished by this very run. */
  justCompleted: boolean;
  /** A streak goal lost its count to this run. */
  streakReset: boolean;
}
