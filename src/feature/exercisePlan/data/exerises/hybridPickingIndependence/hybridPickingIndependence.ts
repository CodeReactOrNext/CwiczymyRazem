import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const hybridPickingIndependenceExercise: Exercise = {
  id: "hybrid_picking_independence",
  title: "Hybrid Picking Independence",
  description: "Combine your pick and fingers to play wide-interval string-skipping lines.",
  whyItMatters: "Hybrid picking bridges the gap between pick control and fingerstyle agility. Using the pick for low strings and fingers for high strings allows you to cross wide string gaps effortlessly, which is essential for modern rock, country, and jazz fusion styles.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Use the pick for lower strings and pluck higher strings with your middle and ring fingers.",
    "Maintain a consistent volume balance between picked and plucked notes."
  ],
  tips: [
    "Keep your picking hand fingers close to the strings to minimize plucking lag.",
    "Anchor your fretting hand fingers firmly to prevent notes from bleeding together."
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 80 },
  relatedSkills: ["hybrid_picking"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }, { string: 1, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }, { string: 1, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }, { string: 1, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }, { string: 1, fret: 5 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.333, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.333, notes: [{ string: 1, fret: 5 }] },
      ],
    },
  ]
};
