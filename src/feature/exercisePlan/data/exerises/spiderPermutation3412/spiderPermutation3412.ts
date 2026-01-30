import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation3412Image from "./image.png";

export const spiderPermutation3412Exercise: Exercise = {
  id: "spider_permutation_3412",
  title: "Spider Exercise - 3-4-1-2 Permutation",
  description: "Chromatic exercise using finger permutation 3-4-1-2, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 3-4-1-2, which means: finger 3, finger 4, finger 1, finger 2.",

  ],
  tips: [
    "The 4-1-2 transition requires special attention - it's a sequence of two challenging movements.",
    "Maintain even tempo and spacing between notes - use a metronome.",
    "Use minimal pressure on the frets - only as much as needed for a clean sound.",
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation3412Image,
}; 
