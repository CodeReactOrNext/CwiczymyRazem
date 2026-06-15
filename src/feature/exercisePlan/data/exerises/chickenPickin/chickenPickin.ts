import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const chickenPickinExercise: Exercise = {
  id: "chicken_pickin",
  title: "Snap and Pop",
  description: "Develop hybrid picking coordination and percussive snapping dynamics.",
  whyItMatters: "Chicken picking is a cornerstone of country and blues lead styles. Snapping the string with your fingers while muting it with your picking hand creates a percussive, high-attack note definition that adds rhythmic energy and dynamic contrast to your playing.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Snap the higher strings aggressively with your middle and ring fingers.",
    "Keep your picking-hand palm rested lightly on the lower strings for instant damping."
  ],
  tips: [
    "Pull the string slightly upward away from the fretboard so it snaps back against the frets.",
    "Relax your picking hand between snaps to maintain fluid rhythmic movement."
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
