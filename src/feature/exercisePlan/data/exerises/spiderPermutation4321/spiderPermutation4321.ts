import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4321Image from "./image.png";


export const spiderPermutation4321Exercise: Exercise = {
  id: "spider_permutation_4321",
  title: "Spider Exercise - 4-3-2-1 Permutation",
  description: "Chromatic exercise using finger permutation 4-3-2-1, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 4-3-2-1, which means: finger 4, finger 3, finger 2, finger 1.",

   
  ],
  tips: [
    "This permutation is completely backward - requires special control over each finger.",
    "Maintain even tempo and spacing between notes - use a metronome.",
    "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    
   
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation4321Image,
}; 