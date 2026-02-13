import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const rhythmicPocketMasteryExercise: Exercise = {
  id: "rhythmic_pocket_mastery",
  title: "Subdivision Control",
  description: "Switch between triplets, eighths, and sixteenths without delays.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Play on a single muted string to focus purely on rhythm.",
    "Bar 1: Play quarter notes (1 2 3 4).",
    "Bar 2: Switch to eighth notes (1-and 2-and 3-and 4-and).",
    "Bar 3: Play eighth note triplets (1-2-3, 2-2-3, 3-2-3, 4-2-3).",
    "Bar 4: Play sixteenth notes (1-e-and-a, 2-e-and-a, 3-e-and-a, 4-e-and-a).",
    "Repeat the cycle maintaining steady tempo throughout."
  ],
  tips: [
    "Clap or tap your foot along with the metronome to feel the pulse with your whole body.",
    "Count out loud to internalize each subdivision.",
    "Your picking hand should move at the fastest subdivision speed.",
    "Start very slow - accuracy is more important than speed."
  ],
  metronomeSpeed: { min: 50, max: 90, recommended: 60 },
  relatedSkills: ["rhythm"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 0 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 0 }] },
      ],
    },
  ]
};
