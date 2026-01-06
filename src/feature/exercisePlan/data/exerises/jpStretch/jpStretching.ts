import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import jpStretchingImage from "./image.png";


export const jpStretching: Exercise = {
  id: "jp_stretching",
  title: "JP stretching",
  description: "JP stretching from Rock Discipline - exercise improving finger flexibility",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 4,
  instructions: [

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
  relatedSkills: [],
  image: jpStretchingImage
};