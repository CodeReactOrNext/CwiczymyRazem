import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4213Image from "./image.png";

export const spiderPermutation4213Exercise: Exercise = {
  id: "spider_permutation_4213",
  title: "Spider Exercise - 4-2-1-3 Permutation",
  description: "Chromatic exercise using finger permutation 4-2-1-3, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 4-2-1-3, which means: finger 4, finger 2, finger 1, finger 3.",
    "Repeat the pattern several times, ensuring even attacks and clean sound.",

  ],
  tips: [
    "The 4-2-1 sequence requires special control - it's a backward movement starting with the weakest finger.",
    "Maintain even tempo and spacing between notes - use a metronome.",


  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation4213Image,
}; 
