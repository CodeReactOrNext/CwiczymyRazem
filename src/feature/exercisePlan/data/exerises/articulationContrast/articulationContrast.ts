import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const articulationContrastExercise: Exercise = {
  id: "articulation_contrast",
  title: "Articulation Contrast",
  description: "Learn to consciously switch between very short (staccato) and very sustained (legato) playing.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Choose a simple melodic phrase (e.g. major scale fragment).",
    "Play the phrase once as Legato as possible — let notes ring into each other.",
    "Play the same phrase immediately after as Staccato as possible — muted with the left hand right after picking.",
    "Alternate bars of Legato and Staccato.",
    "Pay attention to the sudden change in musical mood."
  ],
  tips: [
    "For staccato, release the pressure of the left hand finger without lifting it off the string.",
    "Maintain a steady tempo; do not rush the shorter notes.",
    "Exaggerate the contrast to build clear habit."
  ],
  metronomeSpeed: {
    min: 60,
    max: 120,
    recommended: 80,
  },
  relatedSkills: ["articulation", "phrasing", "technique"],
};
