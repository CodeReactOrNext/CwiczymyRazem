import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import { NOTES } from "utils/audio/noteUtils";

/** A slice of the neck an interval round is confined to, frets inclusive. */
export interface FretWindow {
  startFret: number;
  endFret: number;
}

/** Frets 0–12: what a round falls back to when no narrow window fits it. */
export const WHOLE_NECK_WINDOW: FretWindow = { startFret: 0, endFret: 12 };

/** The highest fret a window may reach — the same ceiling as every other drill. */
const NECK_END = 12;

/**
 * Strings a hand can span between the root and its interval without moving —
 * the same reach the click drills accept an answer within (see clickTargets).
 */
const REACH_STRINGS = 2;

/**
 * Whether the root and the note the interval lands on can both be played inside
 * `window` on `strings`, close enough to each other to be one hand shape. A
 * window that holds the two notes on strings five apart would technically
 * contain the answer, but not as an interval anyone plays.
 */
export function windowFitsInterval(
  window: FretWindow,
  root: string,
  target: string,
  strings?: readonly number[],
): boolean {
  const rootClass = NOTES.indexOf(root);
  const targetClass = NOTES.indexOf(target);
  if (rootClass < 0 || targetClass < 0) return false;
  const roots = getNotePositionsInRange(rootClass, window.startFret, window.endFret, strings);
  const targets = getNotePositionsInRange(targetClass, window.startFret, window.endFret, strings);
  return roots.some((r) => targets.some((t) => Math.abs(r.string - t.string) <= REACH_STRINGS));
}

/** Every `width`-fret window inside frets 0–12 that fits the round. */
export function intervalWindows(
  root: string,
  target: string,
  width: number,
  strings?: readonly number[],
): FretWindow[] {
  const windows: FretWindow[] = [];
  for (let start = 0; start + width - 1 <= NECK_END; start++) {
    const window = { startFret: start, endFret: start + width - 1 };
    if (windowFitsInterval(window, root, target, strings)) windows.push(window);
  }
  return windows;
}

/**
 * A random narrow window for one round, so every question sends the player to a
 * different part of the neck instead of letting them answer from the one spot
 * they know best. Avoids repeating the previous round's window when another
 * fits, and only falls back to the whole neck if no window of that width does.
 */
export function pickIntervalWindow(
  root: string,
  target: string,
  width: number,
  strings?: readonly number[],
  previous?: FretWindow,
): FretWindow {
  const fitting = intervalWindows(root, target, width, strings);
  if (fitting.length === 0) return WHOLE_NECK_WINDOW;
  const fresh = fitting.filter((window) => window.startFret !== previous?.startFret);
  const pool = fresh.length > 0 ? fresh : fitting;
  return pool[Math.floor(Math.random() * pool.length)];
}
