/**
 * How many phases and steps a roadmap is allowed to have. Lives apart from the
 * generator so the admin page can import it without dragging the OpenAI
 * client into the browser bundle.
 *
 * The floor is low on purpose: a goal about one song or one technique is a
 * three-phase plan, and a schema that demanded six phases made every roadmap
 * a year long whatever was asked for (measured: 29–46 steps, 190–285 sessions
 * across the first eight generated roadmaps).
 */
export const STRUCTURE_LIMITS = {
  phases: { min: 3, max: 8 },
  stepsPerPhase: { min: 3, max: 7 },
  /** The same library exercise on more than this many steps reads as filler. */
  maxExerciseReuse: 2,
} as const;

/** The fewest and the most steps a whole roadmap may have before the gate flags it. */
export const TOTAL_STEPS = { min: 9, max: 50 } as const;

/**
 * Exercises the first generated roadmaps reached for whatever the goal was —
 * the top two sat in eight roadmaps out of eight, the rest in seven. They are
 * fine exercises; they are also the ones a model picks when nothing fits. The
 * draft prompt names them so they are used only where the step is exactly
 * about what they train.
 */
export const OVERUSED_EXERCISE_IDS = [
  "muting_discipline_drill",
  "metronome_gap_test",
  "dynamic_crescendo",
  "tone_matching_challenge",
  "rhythmic_pocket_mastery",
] as const;

/** Sessions a week the time estimate assumes — a number the player can relate to. */
export const SESSIONS_PER_WEEK = 4;
