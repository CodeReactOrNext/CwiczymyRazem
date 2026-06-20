import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const openGRepetitionExercise: Exercise = {
  id: "open_g_repetition",
  title: "Open G String Repetition",
  description: "Basic exercise focusing on rhythmic consistency by repeating the open G string.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Pick the open G string (the 3rd string) in a steady, even stream along with the metronome.",
    "Keep every note the same length and the same volume.",
    "Use a clean, plain sound so you can clearly hear each note."
  ],
  tips: [
    "Pick with small, controlled movements so the rhythm stays even.",
    "Lightly rest your hands against the strings you're not playing to keep them quiet.",
    "Sit up straight and stay relaxed to avoid tiring out."
  ],
  whyItMatters: "This exercise improves timing consistency and alternate picking control by training you to play evenly with the metronome. It helps build the precision and stability needed for clean rhythm guitar playing.",
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 60
  },
  examBacking: { url: "/static/sounds/exercise/open_g_string_repetition_backing_track.mp3", sourceBpm: 60 },
  relatedSkills: ["rhythm", 'alternate_picking'],
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
