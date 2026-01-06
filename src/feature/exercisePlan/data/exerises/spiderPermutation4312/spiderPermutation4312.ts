import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4312Image from "./image.png";

export const spiderPermutation4312Exercise: Exercise = {
  id: "spider_permutation_4312",
  title: "Spider Exercise - 4-3-1-2 Permutation",
  description: "Chromatic exercise using finger permutation 4-3-1-2, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 4-3-1-2, which means: finger 4, finger 3, finger 1, finger 2.",

  ],
  tips: [
    "The 3-1-2 transition after the initial finger 4 requires smooth coordination.",
    "Maintain even tempo and spacing between notes - use a metronome.",  

  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation4312Image,
}; 