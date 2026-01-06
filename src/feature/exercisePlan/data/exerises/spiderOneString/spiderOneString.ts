import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderOneStringExercise: Exercise = {
  id: "spider_one_string",
  title: "Single String Spider Exercise",
  description: "Chromatic exercise on a single string developing finger independence and left hand precision.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Start from the first fret on the E string, using fingers 1-2-3-4.",
    "Play sequentially: 1-2-3-4, then 4-3-2-1, maintaining even tempo.",
    "After mastering, move one fret higher and repeat the sequence.",
    "Practice on all strings, starting from the low E."
  ],
  tips: [
    "Keep fingers close to the frets, don't lift them too high.",
    "Pay attention to the even sound of each note.",
    "Start slowly, increase tempo only when the sequence is clean.",
    "Use a metronome to maintain stable tempo.",
    "Practice also in reverse direction (4-3-2-1, 1-2-3-4)."
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["alternate_picking",  "picking"],
  image: spiderBasicImage
};