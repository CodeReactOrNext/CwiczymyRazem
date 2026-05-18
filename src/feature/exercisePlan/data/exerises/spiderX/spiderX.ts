import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderXExercise: Exercise = {
  id: "spider_x",
  title: "Spider X Pattern Exercise",
  description: "Play a diagonal, cross-string spider pattern that forms an 'X' shape.",
  whyItMatters: "Diagonal fretboard movement is highly common in real solos but rarely practiced. The Spider X drill breaks up linear muscle memory, training your brain and fingers to navigate the fretboard dynamically.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Sync diagonal string changes with precise alternate pick strokes.",
    "Move smoothly between positions without disrupting the rhythmic grid."
  ],
  tips: [
    "Keep your thumb positioned behind the neck to support diagonal hand movement.",
    "Mute adjacent strings with both hands to ensure maximum clarity."
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80,
  },
  relatedSkills: ["finger_independence"],
  image: spiderBasicImage,
};