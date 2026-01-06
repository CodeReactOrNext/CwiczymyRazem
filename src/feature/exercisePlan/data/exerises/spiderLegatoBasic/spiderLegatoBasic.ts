import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderLegatoBasicImage from "./image.png";

export const spiderLegatoBasicExercise: Exercise = {
  id: "spider_legato_basic",
  title: "Spider Legato - Basic",
  description: "Basic legato exercise using four fingers, developing finger independence and transition smoothness.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 7,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Pick only the first note, produce subsequent notes using only your left hand (hammer-on/pull-off).",
    "Play in sequence: 1-2-3-4, then 4-3-2-1, all legato.",
    "Repeat the pattern several times, ensuring even sound for each note.",
    "Shift the entire position up one fret and repeat the exercise."
  ],
  tips: [
    "Focus on even strength of hammer-ons and pull-offs.",
    "Each note should be clearly audible and have similar volume.",
    "Work on minimizing unwanted sounds during note transitions.",
    "Initially practice slowly, increase tempo only when you achieve good control.","Try to use as much force as needed, don't overdo it."
  ],
  metronomeSpeed: {
    min: 60,
    max: 120,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "legato"],
  image: spiderLegatoBasicImage,
}; 