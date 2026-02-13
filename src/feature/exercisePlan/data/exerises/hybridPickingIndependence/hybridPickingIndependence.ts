import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const hybridPickingIndependenceExercise: Exercise = {
  id: "hybrid_picking_independence",
  title: "String Skipping",
  description: "Use the pick on bass strings and fingers (m, a) on treble strings.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Use pick for strings 6, 5, and 4 (bass strings).",
    "Use middle finger (m) for string 3 and ring finger (a) for strings 2 and 1.",
    "Play the pattern: Pick on bass, then pluck strings 2 and 1 simultaneously with fingers.",
    "Practice the ascending pattern across different string combinations.",
    "Keep steady rhythm and balance volume between pick and fingers."
  ],
  tips: [
    "Try to balance the volume between the pick stroke and the finger pluck.",
    "Rest your pinky on the guitar body for stability.",
    "Use the pad of your fingers, not the nails, for a warmer tone.",
    "Start very slow - hybrid picking requires independence between pick and fingers."
  ],
  metronomeSpeed: { min: 60, max: 100, recommended: 80 },
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
