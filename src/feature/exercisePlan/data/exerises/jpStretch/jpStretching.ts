import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import jpStretchingImage from "./image.png";


export const jpStretching: Exercise = {
  id: "jp_stretching",
  title: "Petrucci Stretching Exercise",
  description: "John Petrucci's stretching exercise from Rock Discipline - helps improve finger flexibility and reach.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Position your hand at the 12th fret. Place your fingers on frets 12, 13, 14, and 15 of the 6th string.",
    "After completing the sequence, move one fret lower and repeat.",
    "Continue moving down the fretboard until you reach the first fret.",
    "Repeat the exercise on all strings."
  ],
  tips: [
    "Focus on stretching your fingers, not on speed.",
    "Keep your wrist in a neutral position to avoid tension.",
    "If you feel pain (not discomfort), stop the exercise.",
    "Remember to relax your hand between repetitions."
  ],
  metronomeSpeed: null,
  relatedSkills: ["finger_independence"],
  image: jpStretchingImage
};