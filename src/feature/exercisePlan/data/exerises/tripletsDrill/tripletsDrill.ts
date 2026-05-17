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
  description: "Play three even notes per beat on a single string to master the feel and timing of triplet subdivisions.",
  whyItMatters: "This exercise programs the feel of three-note subdivisions (triplets) directly into your internal rhythm. It develops an even picking pulse, prevents rushing the third note, and establishes the essential hand coordination needed for odd-numbered divisions.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.520,
  instructions: [
    "Play exactly three notes per beat on the G string, keeping each note perfectly equal in length.",
    "Use a metronome and tap your foot on every beat, landing note 1 on the click.",
    "Maintain strict alternate picking (down-up-down) inside each triplet group.",
  ],
  tips: [
    "Accent the first note of each triplet group slightly to anchor your rhythmic timing.",
    "Keep your fretting hand fingers hovering close to the fretboard to maintain fluid motion.",
    "Ensure the transition between ascending and descending shapes remains perfectly even.",
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
