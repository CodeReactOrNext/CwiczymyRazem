import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const oneStringBackingExercise: Exercise = {
  id: "one_string_backing",
  title: "Single String Phrasing",
  description: "Exercise developing phrasing skills and musical expression by restricting playing to a single string.",
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Find a YouTube backing track in a style that you enjoy.",
    "Choose one string on your guitar (e.g., G or B) and commit to playing only on it.",
    "Determine the key of the backing track and find notes on your chosen string that fit this key.",
    "Improvise to the backing track using only this one string, focusing on phrasing and expression.",
    "Experiment with various expression techniques: bends, vibrato, slides, ghost notes."
  ],
  tips: [
    "Playing on one string forces creative thinking - use this opportunity!",
    "Pauses are as important as notes - utilize musical space.",
    "Experiment with different registers of the string, from low positions to high ones.",
    "Use dynamics - vary your picking strength to achieve different shades of expression.",
    "Try to imitate vocal phrasing - think of your playing as singing."
  ],
  metronomeSpeed: null,
  relatedSkills: ["phrasing", "improvisation",  "ear_training"],
}; 