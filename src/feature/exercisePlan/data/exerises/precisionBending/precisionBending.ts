import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const precisionBendingExercise: Exercise = {
  id: "precision_bending",
  title: "Precision Bending",
  description: "Exercise developing precision and control when bending strings, focusing on accurately hitting target pitch.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play your target note (e.g., note on 7th fret of B string), listen to it carefully.",
    "Then play your starting note (e.g., note on 5th fret of the same string).",
    "Bend the string, trying to hit exactly the pitch of the target note you heard earlier.",
    "Check your accuracy by playing the target note again and comparing with your bend.",
    "Repeat the process for different intervals: half-step (1 fret), whole-step (2 frets), step-and-a-half (3 frets)."
  ],
  tips: [
    "Use mostly your forearm muscles, not just finger strength.",
    "Maintain a stable wrist position while bending.",
    "For larger intervals (whole tone and more), use multiple fingers to support the bend for better control.",
    "Be careful not to add vibrato - the goal is a clean, stable maintenance of a single pitch.",
    "Regularly check your accuracy by comparing your bend with the target note."
  ],
  metronomeSpeed: null,
  relatedSkills: ["bending",   "technique"],
}; 