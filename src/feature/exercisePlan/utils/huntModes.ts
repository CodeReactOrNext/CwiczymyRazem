import type { Exercise } from "../types/exercise.types";

export type NoteHuntMode = NonNullable<Exercise["noteHuntConfig"]>["mode"];

/**
 * Hunts answered by tapping the neck diagram instead of playing into the mic:
 * the plain click drill and the two-step interval drill. They score without a
 * microphone, share the click leaderboard and the exam mistake limit, and get
 * the shorter exam rotation — so every one of those places asks here rather than
 * comparing against "click" and forgetting the other one.
 */
export function isClickAnsweredMode(mode: NoteHuntMode): boolean {
  return mode === "click" || mode === "intervalClick";
}

/**
 * Whole-neck hunts for a named note, played into the mic: no neck diagram, every
 * octave is the goal. They open behind the start gate and lay their octaves out
 * as tiles, where the hunts with a diagram or a hidden answer don't.
 */
export function isWholeNeckHunt(
  exercise: Pick<Exercise, "customGoal" | "customGoalRegion" | "noteHuntConfig">,
): boolean {
  const mode = exercise.noteHuntConfig?.mode;
  return !!exercise.customGoal && !!exercise.noteHuntConfig && !exercise.customGoalRegion
    && (mode === undefined || mode === "octaves" || mode === "accumulate");
}
