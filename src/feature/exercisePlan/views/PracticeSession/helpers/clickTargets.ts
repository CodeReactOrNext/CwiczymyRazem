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

// How far from the root the player just placed an interval answer may sit: a
// hand's stretch, not the whole neck. Interval drills ask for the interval FROM
// that root, so the answer has to be a shape reachable without moving position —
// the same E four strings and eight frets away is a different musical thought.
export const INTERVAL_REACH_FRETS = 4;
export const INTERVAL_REACH_STRINGS = 2;

/** Whether `cell` sits inside the hand span around `anchor`. */
export function isWithinReach(cell: ClickTarget, anchor: ClickTarget): boolean {
  return (
    Math.abs(cell.fret - anchor.fret) <= INTERVAL_REACH_FRETS &&
    Math.abs(cell.string - anchor.string) <= INTERVAL_REACH_STRINGS
  );
}

/**
 * The positions of the answer note that count as "the interval from THIS root" —
 * the ones inside a hand span of `anchor`. Falls back to every position in the
 * window when the span holds none at all (window edges can clip it), so a round
 * can never end up unanswerable.
 */
export function targetsWithinReach(targets: ClickTarget[], anchor: ClickTarget): ClickTarget[] {
  const near = targets.filter((t) => isWithinReach(t, anchor));
  return near.length > 0 ? near : targets;
}

/**
 * Every cell of the window inside the hand span around `anchor` — the answer's
 * shape included, but so is everything else around it, so this reveals the area
 * in play without giving the note away. Drawn on the board as the reach zone.
 */
export function reachZoneKeys(
  anchor: ClickTarget,
  startFret: number,
  endFret: number,
  strings?: number[],
): string[] {
  const keys: string[] = [];
  for (let string = 1; string <= 6; string++) {
    if (strings && !strings.includes(string)) continue;
    for (let fret = Math.max(0, startFret); fret <= endFret; fret++) {
      if (isWithinReach({ string, fret }, anchor)) keys.push(clickTargetKey({ string, fret }));
    }
  }
  return keys;
}

/** Multiplier the next find is worth once `n` positions are already found. */
export function multiplierForFoundCount(n: number): number {
  return Math.min(8, Math.floor(n / 5) + 1);
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
