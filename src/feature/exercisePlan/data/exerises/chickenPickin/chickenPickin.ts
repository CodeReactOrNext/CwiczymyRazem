import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const chickenPickinExercise: Exercise = {
  id: "chicken_pickin",
  title: "Snap and Pop",
  description: "Practice snapping strings with fingers for that classic country 'pop' sound.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Use the pick for bass notes and downbeats.",
    "Snap the higher strings by pulling them away from the fretboard with your middle or ring finger.",
    "The 'pop' sound comes from the string snapping back against the frets.",
    "Practice on open strings first to get the snapping motion right.",
    "Combine picked notes with snapped notes in a rhythmic pattern.",
    "Add muted 'chick' sounds by lightly touching muted strings with pick."
  ],
  tips: [
    "Pull the string slightly away from the fretboard before releasing for maximum snap.",
    "The snapping motion should be quick and percussive, not a slow pull.",
    "Keep your picking hand relaxed - tension kills the snap.",
    "Listen to Brent Mason, Brad Paisley, or Albert Lee for inspiration."
  ],
  metronomeSpeed: { min: 60, max: 140, recommended: 80 },
  relatedSkills: ["hybrid_picking"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 0, isAccented: true }] },
        { duration: 0.25, notes: [] },
        { duration: 0.5, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 1, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 0, isAccented: true }] },
        { duration: 0.25, notes: [] },
        { duration: 0.5, notes: [{ string: 5, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 0, isAccented: true }] },
        { duration: 0.25, notes: [] },
        { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 0, isAccented: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 0, isAccented: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 0, isAccented: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 1, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 0, isAccented: true }] },
      ],
    },
  ]
};
