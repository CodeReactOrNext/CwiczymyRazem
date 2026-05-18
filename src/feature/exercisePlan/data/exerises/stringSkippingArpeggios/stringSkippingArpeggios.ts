import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const stringSkippingArpeggiosExercise: Exercise = {
  id: "string_skipping_arpeggios",
  title: "Spread Triad Arpeggios",
  description: "Play wide-interval arpeggios using clean string-skipping mechanics.",
  whyItMatters: "Spread triads sound open, majestic, and less predictable than standard block chords. Practicing them with string skipping builds great picking hand control and introduces highly modern melodic textures.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Use alternate picking or hybrid picking to cross wide string gaps cleanly.",
    "Roll your fretting fingers to prevent notes from bleeding together."
  ],
  tips: [
    "Dampen the skipped strings with your picking-hand palm.",
    "Ensure each note of the triad is fully articulated and clearly separated."
  ],
  metronomeSpeed: { min: 60, max: 100, recommended: 75 },
  relatedSkills: ["string_skipping"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 4 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 4 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 10 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 12 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 10 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 12 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 4 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.333, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 10 }] },
        { duration: 0.333, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.333, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 10 }] },
        { duration: 0.333, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.333, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.333, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 10 }] },
      ],
    },
  ]
};
