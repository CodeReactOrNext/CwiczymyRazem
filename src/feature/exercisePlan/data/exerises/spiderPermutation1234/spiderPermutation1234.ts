import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import spiderPermutation1234Image from "./image.png";

export const spiderPermutation1234Exercise: Exercise = {
  id: "spider_permutation_1234",
  title: "Spider Exercise - 1-2-3-4 Permutation",
  description: "Basic chromatic exercise using finger permutation 1-2-3-4, developing finger independence and coordination.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start playing according to the permutation 1-2-3-4, which means: finger 1, finger 2, finger 3, finger 4.",
    "Repeat the pattern several times, ensuring even attacks and clean sound.",
    "Shift the entire position up one fret and repeat the exercise.",
    "Continue throughout the length of the fretboard, then try the exercise on other strings."
  ],
  tips: [
    "This is the most fundamental spider exercise - focus on perfect synchronization.",
    "Maintain even tempo and spacing between notes - use a metronome.",
    "Use minimal pressure on the frets - only as much as needed for a clean sound.",
    "Try to keep other fingers close to the strings, ready to use.",
    "Initially practice slowly, focusing on precision rather than speed."
  ],
  metronomeSpeed: {
    min: 60,
    max: 200,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "picking"],
  image: spiderPermutation1234Image,
};

