import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/**
 * Special configurable scale practice exercise
 * This exercise serves as an entry point - when selected,
 * it shows a dialog to configure scale/pattern/position
 */
export const scalePracticeExercise: Exercise = {
  id: "scale_practice_configurable",
  isHiddenFromLanding: true,
  title: "Scale Practice (Configurable)",
  description: "Practice scale patterns, fingerings, and alternate picking across customizable scales.",
  whyItMatters: "Scales are the foundation of melody and harmony. Developing speed, accuracy, and muscle memory across a wide range of scales is critical for advanced lead playing and composing.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 10,
  instructions: [
    "Maintain strict alternate picking, keeping the motion highly compact.",
    "Ensure each note rings clearly and is fully muted before the next begins."
  ],
  tips: [
    "Practice slowly to master the shifting points between scale positions.",
    "Keep your fretting fingers hovered close to the strings to maximize efficiency."
  ],
  metronomeSpeed: {
    min: 30,
    max: 200,
    recommended: 90
  },
  relatedSkills: ["scales" ],
  // No tablature - it will be generated dynamically
  tablature: undefined
};
