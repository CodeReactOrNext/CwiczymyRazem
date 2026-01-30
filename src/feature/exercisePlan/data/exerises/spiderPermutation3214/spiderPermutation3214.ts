import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation3214Image from "./image.png";

export const spiderPermutation3214Exercise: Exercise = {
  id: "spider_permutation_3214",
  title: "Spider Exercise - 3-2-1-4 Permutation",
  description: "Chromatic exercise using finger permutation 3-2-1-4, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 3-2-1-4, which means: finger 3, finger 2, finger 1, finger 4.",

  ],
  tips: [
    "Pay attention to the backward sequence 3-2-1, which requires precise control.",
    "Maintain even tempo and spacing between notes - use a metronome.",
    "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    "Try to keep other fingers close to the strings, ready to use.",
    "Initially practice slowly, focusing on precision rather than speed."
  ],
  metronomeSpeed: {
    min: 60,
    max: 120,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation3214Image,
}; 
