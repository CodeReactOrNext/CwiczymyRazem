import type { AccentLevel, GridUnit } from "./accentPattern";

/**
 * One complete click grid: what an entry is worth, where the accents fall, how
 * the bars divide it up and how the meter reads for the player.
 *
 * The unit and the pattern are meaningless apart — seven entries are a bar of
 * 7/8 under an eighth grid and 7/4 under a quarter one — so they always travel
 * together (see setAccentGrid).
 */
export interface MetronomeGrid {
  unit: GridUnit;
  pattern: AccentLevel[];
  /** Entries each bar takes. More than one bar = the meter changes inside the pattern. */
  barLengths: number[];
  /** How the meter reads, e.g. "3/4" or "4/4 ↔ 6/8". */
  label?: string;
}

export type TimeSignature = [number, number];

/**
 * Entries a grid may hold.
 *
 * Larger than MAX_BEATS_PER_BAR, which caps what the +/- control can build by
 * hand: a grid that spells out a whole 12/8 ↔ 4/4 pair is twenty entries, and
 * refusing it would leave that drill clicking one of its two bars.
 */
export const MAX_GRID_ENTRIES = 32;

const isValidMeter = (timeSignature: TimeSignature | undefined): timeSignature is TimeSignature => {
  if (!timeSignature) return false;
  const [numerator, denominator] = timeSignature;
  return (
    Number.isInteger(numerator) && Number.isInteger(denominator) && numerator >= 1 && denominator >= 1
  );
};

const sameMeter = (a: TimeSignature, b: TimeSignature) => a[0] === b[0] && a[1] === b[1];

/** Length of one bar in quarter notes — 7/8 is 3.5, 2/2 is 4. */
const quartersIn = ([numerator, denominator]: TimeSignature) => numerator * (4 / denominator);

/**
 * The entries one bar of `timeSignature` contributes to a grid stepping at `unit`,
 * or null when the bar does not divide into whole entries (5/16 is two and a half
 * eighths, so no entry could mark the next bar line).
 *
 * The bar is clicked in the note its own denominator names — quarters for x/4,
 * eighths for x/8 — with the accent on beat one and nothing else. That is exactly
 * what a time signature states; anything further would be a grouping it never
 * claimed, and the player would have to work out where it came from.
 *
 * The unit can be finer than the bar's own beat, which is what happens when a
 * bar in quarters shares a cycle with one in eighths. The entries in between the
 * beats are then muted rather than clicked, so a 4/4 bar still sounds in quarters
 * next to a 6/8 bar sounding in eighths.
 */
export const barPatternFor = (
  timeSignature: TimeSignature,
  unit: GridUnit,
): AccentLevel[] | null => {
  const entries = quartersIn(timeSignature) * (unit / 4);
  if (!Number.isInteger(entries) || entries < 1) return null;

  // Entries per beat of *this* bar. Below one the bar's beat is finer than the
  // grid can resolve (sixteenths on an eighth grid), so it clicks every entry
  // instead of dropping the click to nothing.
  const perBeat = Math.max(1, Math.round(unit / timeSignature[1]));

  return Array.from({ length: entries }, (_, index) => {
    if (index === 0) return 2;
    return index % perBeat === 0 ? 1 : 0;
  });
};

/**
 * How a run of bars reads: the meters it visits, in order, each named once.
 *
 * The distinct meters rather than one name per bar, because the label sits in a
 * single narrow row above the click grid — "4/4 ↔ 2/4" is what a player needs to
 * read off a four-bar cycle, not "4/4 ↔ 4/4 ↔ 4/4 ↔ 2/4". Past four of them
 * there is nothing short left to say, so it falls back to counting the bars.
 */
const labelFor = (meters: readonly TimeSignature[]): string => {
  const names: string[] = [];
  for (const [numerator, denominator] of meters) {
    const name = `${numerator}/${denominator}`;
    if (!names.includes(name)) names.push(name);
  }
  return names.length <= 4 ? names.join(" ↔ ") : `${meters.length} bars`;
};

/**
 * One click grid covering a whole run of bars, so the click changes with the
 * meter instead of holding one bar's shape over all of them.
 *
 * Both bars of a 4/4 ↔ 6/8 pair go into a single pattern end to end — four
 * quarters then six eighths — because the metronome only ever loops one pattern,
 * and the thing that repeats here is the pair, not either bar. The grid steps in
 * eighths as soon as any bar is written in them, and the bars in quarters keep
 * clicking in quarters by muting the eighths in between.
 *
 * Null when a bar cannot be placed on the shared grid at all, or when the run
 * needs more entries than the metronome can hold.
 */
export function cycleGridFor(meters: readonly TimeSignature[]): MetronomeGrid | null {
  if (!meters.length || !meters.every(isValidMeter)) return null;

  const unit: GridUnit = meters.some(([, denominator]) => denominator >= 8) ? 8 : 4;

  const pattern: AccentLevel[] = [];
  const barLengths: number[] = [];
  for (const meter of meters) {
    const bar = barPatternFor(meter, unit);
    if (!bar) return null;
    pattern.push(...bar);
    barLengths.push(bar.length);
  }
  if (pattern.length > MAX_GRID_ENTRIES) return null;

  return { unit, pattern, barLengths, label: labelFor(meters) };
}

/** The click grid for a single bar of `timeSignature` — see cycleGridFor. */
export function gridForTimeSignature(
  timeSignature: TimeSignature | undefined,
): MetronomeGrid | null {
  return isValidMeter(timeSignature) ? cycleGridFor([timeSignature]) : null;
}

/** The bit of a measure this derivation reads — structural types differ per source. */
interface MeasureWithMeter {
  timeSignature?: TimeSignature;
}

/**
 * The shortest run of bars the whole sequence is a repetition of.
 *
 * Only a run that divides the sequence evenly counts: the click loops its
 * pattern from the first beat while the tab loops its bars, so a cycle that
 * doesn't fit a whole number of times into the tab would come back around out
 * of phase on the second pass and drift from there.
 *
 * Falls back to the full length, which is itself a cycle that cannot drift —
 * and which callers reject when it needs more entries than the grid holds.
 */
const cycleLengthOf = (meters: readonly TimeSignature[]): number => {
  const total = meters.length;
  for (let length = 1; length <= total; length += 1) {
    if (total % length !== 0) continue;
    let repeats = true;
    for (let index = length; index < total && repeats; index += 1) {
      repeats = sameMeter(meters[index], meters[index % length]);
    }
    if (repeats) return length;
  }
  return total;
};

/** The most common meter, insertion order breaking ties. */
const dominantMeter = (meters: readonly TimeSignature[]): TimeSignature | null => {
  const tally = new Map<string, { meter: TimeSignature; count: number }>();
  for (const meter of meters) {
    const key = `${meter[0]}/${meter[1]}`;
    const entry = tally.get(key);
    if (entry) entry.count += 1;
    else tally.set(key, { meter, count: 1 });
  }

  let best: TimeSignature | null = null;
  let bestCount = 0;
  for (const { meter, count } of tally.values()) {
    if (count > bestCount) {
      best = meter;
      bestCount = count;
    }
  }
  return best;
};

/**
 * The click grid a tab asks for, or null when it asks for nothing usable.
 *
 * A tab that changes meter gets a pattern spanning its whole repeating cycle, so
 * the click changes with it: a drill alternating 4/4 and 6/8 clicks four quarters
 * and then six eighths, over and over, instead of holding one of the two over
 * both bars.
 *
 * The fallback, for a tab whose meter changes without repeating — or repeats over
 * more bars than the grid can hold — is its most common meter. That is right for
 * most of its bars instead of the 4/4 that is right for none of them, which is the
 * same trade barBeatsOf makes for the bar-line grid, and the best a single looping
 * pattern can do.
 */
export function deriveMetronomeGrid(
  measures: readonly MeasureWithMeter[] | undefined,
): MetronomeGrid | null {
  if (!measures?.length) return null;

  const meters: TimeSignature[] = [];
  let everyBarDeclaresOne = true;
  for (const measure of measures) {
    if (isValidMeter(measure.timeSignature)) meters.push(measure.timeSignature);
    else everyBarDeclaresOne = false;
  }
  if (!meters.length) return null;

  // A gap in the sequence makes the run of bars unreadable — bar 5 might repeat
  // bar 1 or might not — so only the tally survives it.
  if (everyBarDeclaresOne) {
    const cycle = cycleGridFor(meters.slice(0, cycleLengthOf(meters)));
    if (cycle) return cycle;
  }

  return gridForTimeSignature(dominantMeter(meters) ?? undefined);
}
