import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const stringRepetitionExercise: Exercise = {
  id: "all_strings_open_repetition",
  title: "All Strings Open Repetition",
  description: "Advanced rhythm exercise moving across all strings using open notes.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 3,
  instructions: [
    "Navigate through all strings from Low E to High E.",
    "Maintain a steady eighth-note pulse throughout.",
    "Switch between strings accurately according to the tablature."
  ],
  tips: [
    "Keep your pick movement minimal when switching strings.",
    "Mute adjacent strings to avoid unwanted noise.",
    "Pay attention to a consistent eighth-note rhythm."
  ],
  metronomeSpeed: {
    min: 40,
    max: 140,
    recommended: 70
  },
  relatedSkills: ["rhythm"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] },

        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },

        { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 0 }] }
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },

        { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 0 }] }
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0 }] },

        { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0 }] }
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [

        { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },

      ]
    },
    {
      timeSignature: [4, 4],
      beats: [

        { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },

      ]
    },
    {
      timeSignature: [4, 4],
      beats: [

        { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] },

      ]
    },
  ]
};
