import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation2431Image from "./image.png";

export const spiderPermutation2431Exercise: Exercise = {
  id: "spider_permutation_2431",
  title: "Spider Exercise - 2-4-3-1 Permutation",
  description: "Chromatic exercise using finger permutation 2-4-3-1, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 2-4-3-1, which means: finger 2, finger 4, finger 3, finger 1.",
    "Repeat the pattern several times, ensuring even attacks and clean sound.",
    "Shift the entire position up one fret and repeat the exercise.",
    "Continue throughout the length of the fretboard, then try the exercise on other strings."
  ],
  tips: [
    "The 4-1 transition is extremely difficult - requiring a large jump and change in hand position.",
    "Maintain even tempo and spacing between notes - use a metronome.",
    "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    "Try to keep other fingers close to the strings, ready to use.",
    "Initially practice slowly, focusing on precision rather than speed."
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation2431Image,
}; 
