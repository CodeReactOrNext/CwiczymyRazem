// Per-beat accent level driving the metronome's click grid — this is what lets
// a "bar" be an arbitrary custom meter instead of a hardcoded 4/4: 0 mutes the
// beat (a rest in the click pattern), 1 is a plain click, 2 is the accented
// ("one") click. Shared by the desktop (AudioWorklet) and mobile (setTimeout)
// engines so both sound identical for the same pattern.
export type AccentLevel = 0 | 1 | 2;

// 4/4 with the downbeat accented — matches the metronome's previous hardcoded
// "every 4th beat" behavior, so existing sessions sound unchanged by default.
export const DEFAULT_ACCENT_PATTERN: AccentLevel[] = [2, 1, 1, 1];

export const MIN_BEATS_PER_BAR = 1;
// 16 rather than 12 so a bar can be described in eighths (see GridUnit): the odd-meter
// drills alternate two bars — 4/4 then 7/8 is 15 eighths — and the whole alternation has
// to fit in one pattern, because the metronome only ever repeats a single one.
export const MAX_BEATS_PER_BAR = 16;

/**
 * What one entry of the accent pattern is worth.
 *
 * 4 (the default, and what every exercise used before) means one entry per quarter
 * note: `bpm` is the quarter-note tempo, shared with the score, so a pattern entry
 * and a metronome beat are the same thing.
 *
 * 8 means one entry per *eighth*. That is the only way to click a meter whose bars
 * or groups don't land on quarters: 7/8 is 3.5 quarters long, so no whole number of
 * quarter-entries can mark its bar line, and 6/8 grouped 3+3 wants its second accent
 * on quarter 1.5. Under an eighth grid both are exact — 7 entries and 6 entries.
 *
 * It does not change `bpm`, the score, or where the beats fall: it only subdivides
 * the grid the accents are *placed* on, and forces at least two clicks per beat so
 * every entry has a tick to sound on.
 */
export type GridUnit = 4 | 8;

/** Pattern entries per quarter note: 1 for a quarter grid, 2 for an eighth grid. */
export const stepsPerBeat = (unit: GridUnit): number => unit / 4;

/**
 * Ticks per beat the scheduler must run at to place every entry of `unit`'s grid.
 *
 * An eighth grid needs an even tick count so that every other tick lands on an
 * eighth — odd subdivisions (triplets) are doubled rather than rejected, which
 * turns eighth-note triplets into sextuplets and keeps the grid exact.
 */
export const subdivisionCountFor = (subdivision: number, unit: GridUnit): number => {
  const requested = Math.max(1, subdivision);
  if (unit === 4) return requested;
  return requested % 2 === 0 ? requested : requested * 2;
};

// Resize a pattern to `count` beats. Existing accents are kept; new beats are
// added as plain clicks (never silently muting/accenting a beat the user
// didn't touch) and removed beats are simply dropped off the end.
export function resizeAccentPattern(pattern: AccentLevel[], count: number): AccentLevel[] {
  const clamped = Math.max(MIN_BEATS_PER_BAR, Math.min(MAX_BEATS_PER_BAR, count));
  if (clamped === pattern.length) return pattern;
  if (clamped < pattern.length) return pattern.slice(0, clamped);
  return [...pattern, ...(Array(clamped - pattern.length).fill(1) as AccentLevel[])];
}

// Click-to-cycle order: plain click → accent → muted → back to plain.
export function cycleAccentLevel(level: AccentLevel): AccentLevel {
  if (level === 1) return 2;
  if (level === 2) return 0;
  return 1;
}

// Beat index can run past the pattern length (it's a running counter that
// never resets mid-bar), so wrap it into the pattern instead of indexing directly.
export function getAccentLevel(pattern: AccentLevel[], beatIndex: number): AccentLevel {
  if (pattern.length === 0) return 1;
  return pattern[((beatIndex % pattern.length) + pattern.length) % pattern.length] ?? 1;
}
