import type { BossDefinition, ChordFamily } from "../types/boss.types";

/**
 * The stone colossus. One endless fight like the spider's, but every phase
 * deals a chord progression: open chords first, then power chords, barre
 * chords and sevenths, the changes coming quicker as it climbs.
 */
export const COLOSSUS: BossDefinition = {
  id: "colossus",
  name: "The Stone Colossus",
  title: "Breaker of slow changes",
  drill: "chords",
};

/** Frets from the low E string to the high e; null = not played. */
export type ChordFrets = readonly [
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
];

/** Every shape the colossus can deal, by the name the tab prints over it. */
export const CHORD_SHAPES: Readonly<Record<string, ChordFrets>> = {
  // Open
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  A: [null, 0, 2, 2, 2, 0],
  Am: [null, 0, 2, 2, 1, 0],
  D: [null, null, 0, 2, 3, 2],
  Dm: [null, null, 0, 2, 3, 1],
  C: [null, 3, 2, 0, 1, 0],
  G: [3, 2, 0, 0, 0, 3],
  // Power — root, fifth and octave
  E5: [0, 2, 2, null, null, null],
  F5: [1, 3, 3, null, null, null],
  "F#5": [2, 4, 4, null, null, null],
  G5: [3, 5, 5, null, null, null],
  A5: [null, 0, 2, 2, null, null],
  B5: [null, 2, 4, 4, null, null],
  C5: [null, 3, 5, 5, null, null],
  D5: [null, 5, 7, 7, null, null],
  // Barre
  F: [1, 3, 3, 2, 1, 1],
  Fm: [1, 3, 3, 1, 1, 1],
  "F#m": [2, 4, 4, 2, 2, 2],
  Gm: [3, 5, 5, 3, 3, 3],
  Bm: [null, 2, 4, 4, 3, 2],
  Bb: [null, 1, 3, 3, 3, 1],
  Cm: [null, 3, 5, 5, 4, 3],
  // Sevenths
  E7: [0, 2, 0, 1, 0, 0],
  A7: [null, 0, 2, 0, 2, 0],
  B7: [null, 2, 1, 2, 0, 2],
  C7: [null, 3, 2, 3, 1, 0],
  D7: [null, null, 0, 2, 1, 2],
  G7: [3, 2, 0, 0, 0, 1],
  Am7: [null, 0, 2, 0, 1, 0],
  Em7: [0, 2, 0, 0, 0, 0],
  Dm7: [null, null, 0, 2, 1, 1],
  Cmaj7: [null, 3, 2, 0, 0, 0],
  Fmaj7: [null, null, 3, 2, 1, 0],
};

/**
 * Chords that belong together, per family — a progression is drawn from one
 * set, so it sounds like a song and not a shuffle. The first chord is the
 * set's home; in the barre sets it is the barre chord the phase is about.
 */
export const CHORD_SETS: Readonly<Record<ChordFamily, readonly (readonly string[])[]>> = {
  open: [
    ["G", "C", "D", "Em", "Am"],
    ["C", "Am", "G", "Em", "Dm"],
    ["D", "G", "A", "Em"],
    ["A", "D", "E"],
    ["Am", "Dm", "E", "C", "G"],
    ["Em", "Am", "C", "D", "G"],
  ],
  power: [
    ["E5", "G5", "A5", "D5"],
    ["A5", "C5", "D5", "G5"],
    ["E5", "F#5", "G5", "A5", "B5"],
    ["F5", "G5", "A5", "C5"],
  ],
  barre: [
    ["F", "C", "Dm", "Am", "Bb"],
    ["Bm", "G", "D", "A", "Em"],
    ["F#m", "D", "A", "E", "Bm"],
    ["Cm", "Gm", "Bb", "Fm"],
  ],
  seventh: [
    ["E7", "A7", "B7"],
    ["A7", "D7", "E7"],
    ["G7", "C7", "D7"],
    ["Cmaj7", "Am7", "Dm7", "G7"],
    ["Cmaj7", "Fmaj7", "Em7", "Am7", "Dm7"],
  ],
};

export const CHORD_FAMILIES: readonly ChordFamily[] = ["open", "power", "barre", "seventh"];
