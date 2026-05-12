import type { Exercise, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

// Triplet 8th note = 1/3 of a beat. 4/4 bar = 12 triplet notes (4 groups of 3).
// String 3 (G string), Am pentatonic: fret 5 = C, fret 7 = D, fret 9 = E.
// Bar 1: ascending (5-7-9) × 4  — Bar 2: descending (9-7-5) × 4
// Bar 3: alternating asc/desc    — Bar 4: ascending, accent on beat 1 of each group.

const T = 1 / 3;
const S = 3; // string 3 (G string)

const ascBeat = (): { duration: number; tuplet: 3; notes: { string: number; fret: number }[] }[] => [
  { duration: T, tuplet: 3, notes: [{ string: S, fret: 5 }] },
  { duration: T, tuplet: 3, notes: [{ string: S, fret: 7 }] },
  { duration: T, tuplet: 3, notes: [{ string: S, fret: 9 }] },
];

const descBeat = (): { duration: number; tuplet: 3; notes: { string: number; fret: number }[] }[] => [
  { duration: T, tuplet: 3, notes: [{ string: S, fret: 9 }] },
  { duration: T, tuplet: 3, notes: [{ string: S, fret: 7 }] },
  { duration: T, tuplet: 3, notes: [{ string: S, fret: 5 }] },
];

const ascBar = (): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: [...ascBeat(), ...ascBeat(), ...ascBeat(), ...ascBeat()],
});

const descBar = (): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: [...descBeat(), ...descBeat(), ...descBeat(), ...descBeat()],
});

const mixBar = (): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: [...ascBeat(), ...descBeat(), ...ascBeat(), ...descBeat()],
});

const accentBar = (): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: [
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 5 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 7 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 9 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 5 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 7 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 9 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 5 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 7 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 9 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 5 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 7 }] },
    { duration: T, tuplet: 3, notes: [{ string: S, fret: 9 }] },
  ],
});

export const tripletsDrillExercise: Exercise = {
  id: "rhythm_triole",
  title: "Triplets Drill",
  description:
    "Three notes per beat on the G string — C, D, E ascending and descending. Feel the even 3-against-1 pulse while playing a real melodic shape.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.520,
  instructions: [
    "All notes are on string 3 (G string): fret 5 = C, fret 7 = D, fret 9 = E. Use one finger per fret (index–ring–pinky).",
    "Bar 1: ascending C→D→E, repeated 4 times. Use only downstrokes. Count 'trip-a-let' — one syllable per note.",
    "Bar 2: descending E→D→C, repeated 4 times. Same downstroke-only picking.",
    "Bar 3: ascending then descending alternating per beat — asc, desc, asc, desc. Switch to ↓↑↓ per group.",
    "Bar 4: ascending again with ↓↑↓. Accent the first note of every group — hit it slightly harder.",
    "Start at 50 BPM. Tap your foot on every beat — 3 picks per foot tap.",
  ],
  tips: [
    "If the syllables feel uneven, the notes are uneven.",
    "The most common mistake: rushing the third note (E on fret 9). It must land exactly when the next foot tap arrives.",
    "Keep your fretting fingers close to the strings — no more than 1 cm above. Flying fingers break the flow.",
    "Triplets feel different from 8th notes — the upstroke now falls on note 2, not note 3.",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 45 },
  examBacking: { url: "/static/sounds/exercise/triplets_drill_backing_track.mp3", sourceBpm: 50 },
  relatedSkills: ["rhythm"],
  tablature: [
    ascBar(),
    descBar(),
    mixBar(),
    accentBar(),
  ],
};
