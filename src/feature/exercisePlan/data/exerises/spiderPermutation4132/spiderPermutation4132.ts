import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4132Image from "./image.png";

export const spiderPermutation4132Exercise: Exercise = {
  id: "spider_permutation_4132",
  title: "Spider Exercise - 4-1-3-2 Permutation",
  description: "Chromatic exercise using finger permutation 4-1-3-2, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 4-1-3-2, which means: finger 4, finger 1, finger 3, finger 2.",
    "Repeat the pattern several times, ensuring even attacks and clean sound.",
    "Shift the entire position up one fret and repeat the exercise.",
    "Continue throughout the length of the fretboard, then try the exercise on other strings."
  ],
  tips: [
    "The 1-3-2 transition after the initial finger 4 requires special attention.",
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
  image: spiderPermutation4132Image,
}; 
