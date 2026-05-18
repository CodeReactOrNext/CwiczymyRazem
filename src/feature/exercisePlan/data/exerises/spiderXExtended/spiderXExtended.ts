import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderXExtendedExercise: Exercise = {
  id: "spider_x_extended",
  title: "Extended Spider X Exercise",
  description: "Challenge coordination with a wider, multi-position version of the diagonal Spider X.",
  whyItMatters: "The extended version introduces shifting positions along with diagonal string changes. This builds outstanding spatial awareness, finger dexterity, and high-level picking synchronization.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    "Execute horizontal position shifts seamlessly while maintaining diagonal picking.",
    "Keep pick strokes minimal and synchronized with fretting finger contacts."
  ],
  tips: [
    "Maintain a relaxed wrist and shoulder during wide shifts.",
    "Focus on equal note duration and volume across all strings."
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 90,
  },
  relatedSkills: ["finger_independence"],
  image: spiderBasicImage,
};