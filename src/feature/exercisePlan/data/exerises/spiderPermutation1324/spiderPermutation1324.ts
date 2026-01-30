import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderPermutation1324Image from "./image.png";

export const spiderPermutation1324Exercise: Exercise = {
  id: "spider_permutation_1324",
  title: "Spider Exercise - 1-3-2-4 Permutation",
  description: "Chromatic exercise using finger permutation 1-3-2-4, developing finger independence and coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string (e.g., 1st finger on 5th fret, 2nd on 6th, 3rd on 7th, 4th on 8th).",
    "Start playing according to the permutation 1-3-2-4, which means: finger 1, finger 3, finger 2, finger 4.",
    "Repeat the pattern several times, ensuring even attacks and clean sound.",
    "Shift the entire position up one fret and repeat the exercise.",
    "Continue throughout the length of the fretboard, then try the exercise on other strings."
  ],
  tips: [
    "Maintain even tempo and spacing between notes - use a metronome.",
    "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    "Pay attention to unusual transitions (e.g., 3-2), which may be more difficult.",
    "Try to keep other fingers close to the strings, ready to use.",
    "Initially practice slowly, focusing on precision rather than speed."
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation1324Image,
}; 
