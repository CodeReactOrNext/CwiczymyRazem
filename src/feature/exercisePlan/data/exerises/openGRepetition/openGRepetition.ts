import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const openGRepetitionExercise: Exercise = {
  id: "open_g_repetition",
  title: "Open G String Repetition",
  description: "Basic exercise focusing on rhythmic consistency by repeating the open G string.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Play the open G string (3rd string) repeatedly.",
    "Focus on maintaining a steady rhythm and even volume.",
    "Use alternate picking if possible."
  ],
  tips: [
    "Keep your picking hand relaxed.",
    "Listen carefully to the metronome.",
    "Try to sync your picks perfectly with the beats."
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 60
  },
  relatedSkills: ["rhythm", "technique", "picking"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] }
      ]
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 0 }] }
      ]
    }
  ]
};
