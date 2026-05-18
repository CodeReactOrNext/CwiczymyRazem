import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const SpiderStringSkippingExercise: Exercise = {
  id: "spider_string_skipping",
  title: "String Skipping Spider Exercise",
  description: "Integrate wide string jumps into the spider walk pattern.",
  whyItMatters: "String skipping can easily cause missed notes or accidental string noise. Combining it with the spider walk forces both hands to sync perfectly, building elite-level coordinate agility.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Coordinate large string skips with precise alternate picking strokes.",
    "Keep your picking hand movement highly controlled when crossing strings."
  ],
  tips: [
    "Use your fretting hand fingers to mute adjacent strings during wide skips.",
    "Keep your eyes focused on the target string to guide your picking hand."
  ],
  metronomeSpeed: {
    min: 60,
    max: 160,
    recommended: 80,
  },
  relatedSkills: ["string_skipping", "finger_independence"],
  image: spiderBasicImage,
};