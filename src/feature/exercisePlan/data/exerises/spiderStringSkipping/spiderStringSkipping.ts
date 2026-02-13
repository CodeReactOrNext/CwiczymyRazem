import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const SpiderStringSkippingExercise: Exercise = {
  id: "spider_string_skipping",
  title: "String Skipping Spider Exercise",
  description: "Exercise developing coordination in string skipping and right hand precision.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Start from the first fret on the E string, then skip one string.",
    "Perform the 1-2-3-4 pattern on alternating strings.",
    "After each repetition, move one fret higher.",
    "Pay special attention to clean notes when skipping strings."
  ],
  tips: [
    "Control pick movement, avoiding hitting skipped strings.",
    "Maintain stable right hand position during skips.",
    "Start with slow tempo, focusing on skip precision.",
    "Experiment with different string combinations.",
    "Practice also in reverse (from high to low strings)."
  ],
  metronomeSpeed: {
    min: 60,
    max: 160,
    recommended: 80,
  },
  relatedSkills: ["string_skipping", "finger_independence"],
  image: spiderBasicImage,
};