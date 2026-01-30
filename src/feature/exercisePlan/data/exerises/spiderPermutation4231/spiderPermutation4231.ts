import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4231Image from "./image.png";

export const spiderPermutation4231Exercise: Exercise = {
  id: "spider_permutation_4231",
  title: "Spider Exercise - 4-2-3-1 Permutation",
  description: "Chromatic exercise using finger permutation 4-2-3-1, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 4-2-3-1, which means: finger 4, finger 2, finger 3, finger 1.",

  ],
  tips: [
    "Ending the sequence with finger 1 after finger 3 requires precise movement under the other fingers.",
    "Maintain even tempo and spacing between notes - use a metronome.",

  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation4231Image,
}; 
