import {
  bar,
  beat,
  note,
} from "feature/exercisePlan/data/exerises/tabBuilders";
import type {
  Exercise,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

/** A chord written as frets from the low E string up; `null` = string not played. */
const chord = (frets: (number | null)[]): TablatureNote[] =>
  frets.flatMap((fret, i) => (fret === null ? [] : [note(6 - i, fret)]));

const E_MINOR = chord([0, 2, 2, 0, 0, 0]);
const A_MINOR = chord([null, 0, 2, 2, 1, 0]);
const C_MAJOR = chord([null, 3, 2, 0, 1, 0]);
const G_MAJOR = chord([3, 2, 0, 0, 0, 3]);
const D_MAJOR = chord([null, null, 0, 2, 3, 2]);

const A7 = chord([null, 0, 2, 0, 2, 0]);
const D7 = chord([null, null, 0, 2, 1, 2]);
const E7 = chord([0, 2, 0, 1, 0, 0]);

const strums = (shape: TablatureNote[], name: string, count: number, duration: number) =>
  Array.from({ length: count }, (_, i) =>
    beat(duration, shape, i === 0 ? { chordName: name } : {}),
  );

export const openChordsFirstChangesExercise: Exercise = {
  id: "open_chords_first_changes",
  addedAt: "2026-11-13",
  title: "Open Chords — First Changes",
  description:
    "Five open chords and the changes between them, two slow strums per chord so there is time to move.",
  whyItMatters:
    "E minor, A minor, C, G and D are enough to play thousands of songs. Knowing the shapes is the easy half — the real skill is getting from one to the next in time, and that only comes from practising the change itself.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Strum each chord once and let it ring for two beats.",
    "Start moving to the next chord during the second beat, so it is ready when the bar line arrives.",
    "Bars 1–2: E minor and A minor — the two fingers on fret 2 move together, one string over.",
    "Bars 3–4: C, G and D. Take the tempo down if these changes are late.",
  ],
  tips: [
    "Look for fingers that stay put or travel together between two chords — move those as a unit.",
    "Strum on time even if the chord is not fully formed. The rhythm teaches the fingers to hurry.",
    "Press with the fingertips and keep the knuckles bent, so each finger clears the string below it.",
  ],
  metronomeSpeed: { min: 40, max: 110, recommended: 60 },
  relatedSkills: ["chords", "rhythm"],
  tablature: [
    bar([...strums(E_MINOR, "Em", 1, 2), ...strums(A_MINOR, "Am", 1, 2)]),
    bar([...strums(E_MINOR, "Em", 1, 2), ...strums(A_MINOR, "Am", 1, 2)]),
    bar([...strums(C_MAJOR, "C", 1, 2), ...strums(G_MAJOR, "G", 1, 2)]),
    bar([...strums(D_MAJOR, "D", 1, 2), ...strums(G_MAJOR, "G", 1, 2)]),
  ],
};

export const openChordsBluesSeventhsExercise: Exercise = {
  id: "open_chords_blues_sevenths",
  addedAt: "2026-11-13",
  title: "Open Chords — Blues Sevenths",
  description:
    "The three open dominant seventh chords — A7, D7 and E7 — strummed on every beat through a short blues change.",
  whyItMatters:
    "A7, D7 and E7 are the whole harmony of a blues in A, and each one is an easy open shape. The seventh is what gives them their restless, bluesy colour — learn these three and you can accompany any twelve-bar blues.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "A7: an A chord with the G string left open. D7: a triangle on the top three strings. E7: an E chord with the D string left open.",
    "Strum down once per beat, four strums per bar.",
    "Bar 1: A7. Bar 2: D7. Bar 3: A7. Bar 4: two beats of E7, then back to A7.",
    "Keep the strumming hand moving through the changes.",
  ],
  tips: [
    "Listen for the open string inside A7 and E7 — if it is muted by a neighbouring finger, the chord loses its seventh.",
    "On D7 strum from the D string only; the two low strings stay out.",
    "When this is steady, play each bar with the shuffle feel from the boogie riff.",
  ],
  metronomeSpeed: { min: 40, max: 130, recommended: 70 },
  relatedSkills: ["chords", "rhythm", "harmony"],
  tablature: [
    bar(strums(A7, "A7", 4, 1)),
    bar(strums(D7, "D7", 4, 1)),
    bar(strums(A7, "A7", 4, 1)),
    bar([...strums(E7, "E7", 2, 1), ...strums(A7, "A7", 1, 2)]),
  ],
};

/** A chord picked one string at a time: bass note, up to the top, and back. */
const picked = (name: string, positions: [number, number][]) =>
  bar(
    positions.map(([string, fret], i) =>
      beat(
        0.5,
        note(string, fret, { isLetRing: true }),
        i === 0 ? { chordName: name } : {},
      ),
    ),
  );

export const pickedOpenChordArpeggiosExercise: Exercise = {
  id: "arpeggios_picked_open_chords",
  addedAt: "2026-11-13",
  title: "Arpeggios — Picked Open Chords",
  description:
    "Hold an open chord and pick through it one string at a time — up from the bass note and back — over Am, C, G and Em.",
  whyItMatters:
    "Picking through a held chord is the sound of countless ballad intros and clean verses. It trains the pick to find individual strings without looking, and it exposes any string in the chord that is not ringing cleanly.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Fret the whole chord before the bar starts and keep every finger down to the end of it.",
    "Pick the bass note, climb to the high E string, then come back down — eight even eighth notes.",
    "Let every note ring over the next ones.",
    "Change chord on the bar line without breaking the stream of eighth notes.",
  ],
  tips: [
    "Use downstrokes going up through the strings and upstrokes coming back.",
    "Rest the side of the picking hand on the bridge so the pick always knows where the strings are.",
    "If a note sounds dead, a finger is leaning on it — arch that finger more.",
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 70 },
  relatedSkills: ["chords", "alternate_picking"],
  tablature: [
    picked("Am", [[5, 0], [4, 2], [3, 2], [2, 1], [1, 0], [2, 1], [3, 2], [4, 2]]),
    picked("C", [[5, 3], [4, 2], [3, 0], [2, 1], [1, 0], [2, 1], [3, 0], [4, 2]]),
    picked("G", [[6, 3], [4, 0], [3, 0], [2, 0], [1, 3], [2, 0], [3, 0], [4, 0]]),
    picked("Em", [[6, 0], [4, 2], [3, 0], [2, 0], [1, 0], [2, 0], [3, 0], [4, 2]]),
  ],
};
