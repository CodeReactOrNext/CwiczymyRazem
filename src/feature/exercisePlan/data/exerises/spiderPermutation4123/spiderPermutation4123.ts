import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation4123Image from "./image.png";

export const spiderPermutation4123Exercise: Exercise = {
  id: "spider_permutation_4123",
  title: "Spider Exercise - 4-1-2-3 Permutation",
  description: "Chromatic exercise using finger permutation 4-1-2-3, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 4-1-2-3, which means: finger 4, finger 1, finger 2, finger 3.",
    "Repeat the pattern several times, ensuring even attacks and clean sound.",
    "Shift the entire position up one fret and repeat the exercise.",
    "Continue throughout the length of the fretboard, then try the exercise on other strings."
  ],
  tips: [
    "Starting with finger 4 is unusual - make sure you have good control over this finger.",
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
  image: spiderPermutation4123Image,
}; 
