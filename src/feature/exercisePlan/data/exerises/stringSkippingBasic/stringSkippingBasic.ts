import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const stringSkippingBasicExercise: Exercise = {
  id: "string_skipping_basic",
  title: "Pentatonic String Skips",
  description: "Practice jumping over strings while playing pentatonic scale shapes.",
  whyItMatters: "Pentatonic scales can sound repetitive if played sequentially. Adding string skips opens up the scale, creating larger interval jumps that sound highly expressive and modern.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Skip strings accurately, keeping your pick strokes compact and efficient.",
    "Sync fretting finger placement perfectly with picking hand skips."
  ],
  tips: [
    "Rest your picking-hand palm on lower strings to prevent unwanted vibration.",
    "Visualize the pentatonic skeleton to locate the target notes instantly."
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 80 },
  relatedSkills: ["string_skipping"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.333, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.333, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.333, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 7 }] },
      ],
    },
  ]
};
