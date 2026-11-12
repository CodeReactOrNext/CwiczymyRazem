import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// One finger per fret in 5th position (index 5 … pinky 8), so every pattern
// opens on the pinky.
export const pinkyPowerDrillExercise: Exercise = {
  id: "pinky_power_drill",
  title: "Pinky-Led Patterns",
  description: "Strengthen your weakest finger by playing linear patterns that initiate with the pinky.",
  whyItMatters: "Most guitarists suffer from an under-developed pinky finger, leading to uneven speed and restricted fretboard patterns. Isolating the pinky improves hand balance, dexterity, and overall fretting agility.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Start each pattern with a strong, clean pinky contact.",
    "Ensure the pinky finger remains curved and does not collapse at the joints."
  ],
  tips: [
    "Focus on equal volume between your index and pinky fingers.",
    "Keep your hand position balanced to prevent over-reaching with the pinky."
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 80 },
  relatedSkills: ["finger_independence"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6, finger: 2 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5, finger: 1 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, finger: 2 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5, finger: 1 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, finger: 2 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5, finger: 1 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, finger: 2 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5, finger: 1 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6, finger: 2 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5, finger: 1 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, finger: 2 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5, finger: 1 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, finger: 2 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5, finger: 1 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, finger: 2 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5, finger: 1 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5, finger: 1 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 8, finger: 4 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, finger: 3 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5, finger: 1 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 8, finger: 4 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 6, finger: 2 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 8, finger: 4 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, finger: 1 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.333, tuplet: 3, notes: [{ string: 6, fret: 8, finger: 4 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 6, fret: 7, finger: 3 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 6, fret: 6, finger: 2 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 5, fret: 8, finger: 4 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 5, fret: 7, finger: 3 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 5, fret: 6, finger: 2 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 4, fret: 8, finger: 4 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 4, fret: 7, finger: 3 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 4, fret: 6, finger: 2 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 3, fret: 8, finger: 4 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 3, fret: 7, finger: 3 }] },
        { duration: 0.333, tuplet: 3, notes: [{ string: 3, fret: 6, finger: 2 }] },
      ],
    },
  ]
};
