import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const openGRepetitionExercise: Exercise = {
  id: "open_g_repetition",
  title: "Open G String Repetition",
  description: "Basic exercise focusing on rhythmic consistency by repeating the open G string.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Execute notes cleanly while suppressing all sympathetic string vibrations.",
    "Audit your dynamic consistency and attack angle using a clean tone.",
    "Transition between positions fluidly without disrupting the rhythmic grid."
  ],
  tips: [
    "Mute low strings with your picking-hand palm and high strings with your fretting-hand index finger.",
    "Ensure notes do not bleed together during chord transitions unless explicitly sustained.",
    "Maintain an upright, relaxed posture to prevent muscle fatigue."
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
