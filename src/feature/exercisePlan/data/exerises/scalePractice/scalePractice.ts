import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/**
 * Special configurable scale practice exercise
 * This exercise serves as an entry point - when selected,
 * it shows a dialog to configure scale/pattern/position
 */
export const scalePracticeExercise: Exercise = {
  id: "scale_practice_configurable",
  title: "Scale Practice (Configurable)",
  description: "Choose your scale, pattern, and position for customized scale practice.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 10,
  instructions: [
    "This is a configurable scale practice exercise.",
    "When you start, you'll be able to choose:",
    "• Root note (C, D, E, F, G, A, B, and their sharps)",
    "• Scale type (Major, Minor, Pentatonic, Modes)",
    "• Practice pattern (Ascending, Descending, Sequences)",
    "• Position on the fretboard (1-12)",
    "The system will generate tablature automatically based on your choices."
  ],
  tips: [
    "Start with Major and Minor pentatonic scales - they're the foundation.",
    "Practice each position until you can play it smoothly without looking.",
    "Use a metronome and gradually increase tempo.",
    "Learn the sound of each scale - not just the finger patterns.",
    "Practice modes to understand how they differ from major/minor.",
    "Move the same pattern across all 12 positions to master the fretboard."
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 90
  },
  relatedSkills: ["scales" ],
  // No tablature - it will be generated dynamically
  tablature: undefined
};
