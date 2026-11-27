import type { NoteHuntMode } from "feature/exercisePlan/utils/huntModes";
import { EXAM_STAR_ACCURACY } from "feature/journey/utils/examStars";

/**
 * How long a click-answered round stays up in an exam. Free practice runs much
 * longer rounds; in an exam the wide-open window let players brute-force every
 * cell on the board, and 10 s still allows a careful scan.
 */
export const EXAM_CLICK_ROTATE_SECONDS = 10;

/** An interval-click round asks for two clicks (the root, then the interval
 *  above it), so its exam round gets more time than a single "find the note". */
export const EXAM_INTERVAL_CLICK_ROTATE_SECONDS = 15;

/** Round length of a click-answered exam round in this hunt mode. */
export const examClickRotateSeconds = (mode: NoteHuntMode | undefined): number =>
  mode === "intervalClick" ? EXAM_INTERVAL_CLICK_ROTATE_SECONDS : EXAM_CLICK_ROTATE_SECONDS;

/**
 * Share of the exam's rounds that has to be solved, counting the rounds as if
 * each one ran its full time. A round left to run out already ends the exam, so
 * a run that reaches the end of the clock is always past this; what it stops is
 * an exam handed in early, after a round or two, as a pass.
 */
const MIN_SOLVED_SHARE = 2 / 3;

/** Rounds an interval-click exam of this length has to see solved to pass. */
export const intervalClickExamMinRounds = (examMinutes: number): number =>
  Math.max(1, Math.floor(((examMinutes * 60) / EXAM_INTERVAL_CLICK_ROTATE_SECONDS) * MIN_SOLVED_SHARE));

/**
 * The interval-click exam as an exam accuracy (0–100), the number its stars are
 * read from (accuracyToStars).
 *
 * The exam is passed on hearts, not on the click rate: three wrong clicks end it
 * as a fail on their own (CLICK_EXAM_MISTAKE_LIMIT), and so does a round left
 * unanswered (PracticeSession), so a run that reaches the end with a heart left
 * and enough rounds solved passes, even where one or two
 * wrong clicks put its click rate under the pass mark. The higher stars still go
 * by the click rate. A run short of the rounds is graded as if the missing rounds
 * were misses, and never reaches the pass mark.
 */
export function intervalClickExamAccuracy(accuracy: number, solvedRounds: number, minRounds: number): number {
  const passMark = EXAM_STAR_ACCURACY[0];
  if (solvedRounds < minRounds) {
    return Math.min(passMark - 1, Math.round((accuracy * solvedRounds) / Math.max(1, minRounds)));
  }
  return Math.max(accuracy, passMark);
}
