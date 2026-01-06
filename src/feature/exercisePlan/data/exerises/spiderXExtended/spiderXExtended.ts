import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderXExtendedExercise: Exercise = {
  id: "spider_x_extended",
  title: "Extended Spider X Exercise",
  description: "Advanced version of X exercise with wider stretches and complex patterns.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    "Start with basic X pattern, then extend the layout by an additional fret.",
    "Perform the sequence on three adjacent strings.",
    "Add direction changes within the pattern.",
    "Combine different variants of the extended X pattern."
  ],
  tips: [
    "Pay special attention to ergonomics with wider stretches.",
    "Adjust wrist position for the extended layout.",
    "Take breaks at first signs of fatigue.",
    "Gradually increase pattern complexity.",
    "Regularly return to basic version for comparison."
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 90,
  },
  relatedSkills: ["alternate_picking", "picking", "finger_independence"],
  image: spiderBasicImage,
};