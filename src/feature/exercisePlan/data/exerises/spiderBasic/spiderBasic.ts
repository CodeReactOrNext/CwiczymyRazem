import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import spiderBasicImage from "./image.png";


export const spiderBasicExercise: Exercise = {
  id: "spider_basic",
  title: "Spider Exercise",
  description: "Exercise developing left hand precision and synchronization with right hand.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Perform the 'spider' exercise on the guitar, playing 4 notes per beat (i.e. sixteenths). Maintain the pattern shown on the tablature, shifting it every fret after completing a repetition.",
   
  ],
  tips: [
    "Focus on even pressure and smooth movements.",
    "Try not to lift fingers unnecessarily to maintain stability and economy of movement.",
    "Practice intonation, ensuring each note sounds clean and clear.",
    "Control hand tension, don't squeeze the neck too hard but maintain stability.",
    "Adjust tempo to your abilities, gradually increasing it.",
    "You can freely change position on the fretboard to practice different hand arrangements.",
  ],
  metronomeSpeed: {
    min: 60,
    max: 180,
    recommended: 80,
  },
  relatedSkills: ["alternate_picking", "finger_independence",  "picking"],
  image: spiderBasicImage,
};