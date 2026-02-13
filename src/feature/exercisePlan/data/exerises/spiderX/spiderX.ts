import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderXExercise: Exercise = {
  id: "spider_x",
  title: "Spider X Pattern Exercise",
  description: "Exercise using X-pattern to develop finger independence and hand coordination.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Position fingers in an X shape on two adjacent strings.",
    "Play alternating notes from both strings, maintaining the X pattern.",
    "Move the pattern one fret higher after each cycle.",
    "Repeat the exercise on all adjacent string pairs."
  ],
  tips: [
    "Pay attention to note clarity when crossing fingers.",
    "Maintain minimal hand tension despite unusual pattern.",
    "Practice slowly, focusing on movement accuracy.",
    "Experiment with different rhythms within the pattern."
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80,
  },
  relatedSkills: ["finger_independence"],
  image: spiderBasicImage,
};