/**
 * How many phases and steps a roadmap is allowed to have. Lives apart from the
 * generator so the admin page can import it without dragging the OpenAI
 * client into the browser bundle.
 */
export const STRUCTURE_LIMITS = {
  phases: { min: 6, max: 8 },
  stepsPerPhase: { min: 4, max: 7 },
  /** The same library exercise on more than this many steps reads as filler. */
  maxExerciseReuse: 2,
} as const;
