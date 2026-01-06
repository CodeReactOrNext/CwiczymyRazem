import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation3241Image from "./image.png";

export const spiderPermutation3241Exercise: Exercise = {
  id: "spider_permutation_3241",
  title: "Spider Exercise - 3-2-4-1 Permutation",
  description: "Chromatic exercise using finger permutation 3-2-4-1, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 3-2-4-1, which means: finger 3, finger 2, finger 4, finger 1.",

  ],
  tips: [
    "This permutation ends with a challenging 4-1 transition, requiring a large jump.",
    "Maintain even tempo and spacing between notes - use a metronome.",
    "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    "Try to keep other fingers close to the strings, ready to use.",
    
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation3241Image,
}; 