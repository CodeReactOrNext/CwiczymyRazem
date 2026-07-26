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
export const MAX_BEATS_PER_BAR = 12;

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
