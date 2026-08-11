import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import { NOTES } from "utils/audio/noteUtils";

/** A single answerable cell on the neck diagram. */
export interface ClickTarget {
  string: number;
  fret: number;
}

/** Stable identity of a cell — the key both click hunts track "found" positions by. */
export const clickTargetKey = (p: ClickTarget) => `${p.string}-${p.fret}`;

/**
 * Every valid (string, fret) position of `note` inside the exercise's window,
 * optionally narrowed to a set of strings (1 = high e … 6 = low E). Empty for a
 * note name the app doesn't recognise.
 */
export function computeClickTargets(
  note: string,
  startFret: number,
  endFret: number,
  strings?: number[],
): ClickTarget[] {
  const pitchClass = NOTES.indexOf(note);
  if (pitchClass < 0) return [];
  return getNotePositionsInRange(pitchClass, startFret, endFret, strings).map((p) => ({
    string: p.string,
    fret: p.fret,
  }));
}

/**
 * Escalating score for finding `n` positions — the same curve as the mic-based
 * hunts: every 5 finds bumps the multiplier, capped at 8×.
 */
export function scoreForFoundCount(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) total += 100 * multiplierForFoundCount(i);
  return total;
}

/** Multiplier the next find is worth once `n` positions are already found. */
export function multiplierForFoundCount(n: number): number {
  return Math.min(8, Math.floor(n / 5) + 1);
}
