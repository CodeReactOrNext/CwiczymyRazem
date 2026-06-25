import { NOTES } from "utils/audio/noteUtils";

// Pitch-class index for a root spelling, normalising flats to the sharp names used
// by NOTES (C, C#, D, …, B).
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B", Fb: "E",
};

function rootToPitchClass(root: string): number {
  const normalised = FLAT_TO_SHARP[root] ?? root;
  return NOTES.indexOf(normalised);
}

/** Split a chord name into its root spelling and quality suffix. */
function splitChordName(name: string): { root: string; quality: string } {
  const match = /^([A-G][#b]?)(.*)$/.exec(name.trim());
  if (!match) return { root: name, quality: "" };
  return { root: match[1], quality: match[2] };
}

/** Pitch class (0–11) of a chord's root, e.g. "Am7" → 9 (A), "F#m" → 6. */
export function parseChordRoot(name: string): number {
  return rootToPitchClass(splitChordName(name).root);
}

// Quality → semitone offsets from the root + a degree label per tone. Kept small
// and triad-first; sevenths included for the common shapes.
const QUALITIES: { test: (q: string) => boolean; intervals: number[]; labels: string[] }[] = [
  { test: q => /^(maj7|M7|Δ7?)$/.test(q),        intervals: [0, 4, 7, 11], labels: ["R", "3", "5", "7"] },
  { test: q => /^(m7|min7|-7)$/.test(q),         intervals: [0, 3, 7, 10], labels: ["R", "3", "5", "7"] },
  { test: q => /^(m7b5|ø)$/.test(q),             intervals: [0, 3, 6, 10], labels: ["R", "3", "5", "7"] },
  { test: q => /^(dim7|°7)$/.test(q),            intervals: [0, 3, 6, 9],  labels: ["R", "3", "5", "7"] },
  { test: q => /^7$/.test(q),                    intervals: [0, 4, 7, 10], labels: ["R", "3", "5", "7"] },
  { test: q => /^6$/.test(q),                    intervals: [0, 4, 7, 9],  labels: ["R", "3", "5", "6"] },
  { test: q => /^m6$/.test(q),                   intervals: [0, 3, 7, 9],  labels: ["R", "3", "5", "6"] },
  { test: q => /^(dim|°)$/.test(q),              intervals: [0, 3, 6],     labels: ["R", "3", "5"] },
  { test: q => /^(aug|\+)$/.test(q),             intervals: [0, 4, 8],     labels: ["R", "3", "5"] },
  { test: q => /^sus2$/.test(q),                 intervals: [0, 2, 7],     labels: ["R", "2", "5"] },
  { test: q => /^(sus4|sus)$/.test(q),           intervals: [0, 5, 7],     labels: ["R", "4", "5"] },
  { test: q => /^(m|min|-)$/.test(q),            intervals: [0, 3, 7],     labels: ["R", "3", "5"] },
];

const MAJOR = { intervals: [0, 4, 7], labels: ["R", "3", "5"] };

/**
 * Member pitch classes of a chord, derived from its name + interval formula (not
 * from a fret shape, which can be an incomplete voicing). `tones[0]` is the root.
 */
export function getChordTones(name: string): { root: number; tones: number[]; labels: string[] } {
  const { root, quality } = splitChordName(name);
  const rootPc = rootToPitchClass(root);
  const spec = QUALITIES.find(q => q.test(quality)) ?? MAJOR;
  return {
    root: rootPc,
    tones: spec.intervals.map(i => (rootPc + i) % 12),
    labels: spec.labels,
  };
}
