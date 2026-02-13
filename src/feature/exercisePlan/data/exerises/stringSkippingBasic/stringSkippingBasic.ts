import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const stringSkippingBasicExercise: Exercise = {
  id: "string_skipping_basic",
  title: "Pentatonic String Skips",
  description: "Master the fundamental string skipping motion with pentatonic patterns.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Play the A minor pentatonic scale, skipping one string between each note.",
    "Use strict alternate picking throughout (down-up-down-up).",
    "Start with the pattern: 6th string → 4th string → 3rd string → 1st string.",
    "Make an arc motion with your pick to skip over the unwanted string.",
    "Keep your fretting hand relaxed - only the picking hand needs to work harder.",
    "Once comfortable, reverse the pattern going back down."
  ],
  tips: [
    "The picking motion should come from the wrist, not the whole arm.",
    "Visualize the target string before you move your pick.",
    "Start extremely slow - accuracy is more important than speed.",
    "Practice the arc motion on open strings first to build muscle memory.",
    "Listen to Paul Gilbert's string skipping runs for inspiration."
  ],
  metronomeSpeed: { min: 60, max: 120, recommended: 80 },
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
