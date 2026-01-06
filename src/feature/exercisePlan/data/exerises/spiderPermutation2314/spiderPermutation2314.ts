import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation2314Image from "./image.png";

export const spiderPermutation2314Exercise: Exercise = {
  id: "spider_permutation_2314",
  title: "Spider Exercise - 2-3-1-4 Permutation",
  description: "Chromatic exercise using finger permutation 2-3-1-4, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 2-3-1-4, which means: finger 2, finger 3, finger 1, finger 4.",
    "Repeat the pattern several times, ensuring even attacks and clean sound.",
    "Shift the entire position up one fret and repeat the exercise.",
    "Continue throughout the length of the fretboard, then try the exercise on other strings."
  ],
  tips: [
    "The 3-1 transition is particularly difficult - it requires jumping finger 1 under finger 3.",
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
  relatedSkills: ["finger_independence", "technique"],
  image: spiderPermutation2314Image,
}; 