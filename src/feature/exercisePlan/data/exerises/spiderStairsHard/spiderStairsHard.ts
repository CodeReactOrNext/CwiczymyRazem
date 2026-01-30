import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderStairsHardExercise: Exercise = {
  id: "spider_stairs_hard",
  title: "Advanced Spider Stairs Exercise",
  description: "Advanced version of the stairs exercise with wider note intervals and faster tempo.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Start from the first fret on the E string, using fingers 1-2-4.",
    "Move to the next string shifting two frets higher.",
    "Continue the pattern until the highest string, increasing finger stretch.",
    "Return the same way down, maintaining movement precision."
  ],
  tips: [
    "Pay special attention to precision with wider stretches.",
    "Maintain proper wrist position despite larger distances.",
    "Control pressure - it's easy to press too hard with wider stretches.",
    "If you feel discomfort, reduce tempo.",

  ],
  metronomeSpeed: {
    min: 60,
    max: 200,
    recommended: 90,
  },
  relatedSkills: ["alternate_picking", "picking", "legato", "technique"],
  image: spiderBasicImage,
};