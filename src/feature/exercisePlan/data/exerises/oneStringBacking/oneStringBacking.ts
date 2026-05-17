import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const oneStringBackingExercise: Exercise = {
  id: "one_string_backing",
  title: "Single String Phrasing",
  description: "Improvise over a backing track while physically restricting your playing to a single string.",
  whyItMatters: "Removing the ability to play across strings eliminates reliance on familiar vertical box shapes. This forces you to navigate the fretboard horizontally, significantly improving your ability to connect distant positions and demanding a heavy reliance on expressive techniques (slides, bends) to keep the phrasing interesting.",
  requiresBackingTrack: true,
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Select a backing track in a key you are comfortable with.",
    "Choose exactly one string (e.g., the G or B string) and do not play any notes on other strings.",
    "Locate the root notes and scale degrees of the key horizontally along your chosen string.",
    "Improvise freely, using only horizontal movement to build melodies.",
  ],
  tips: [
    "Since your note choices are limited, focus heavily on phrasing: utilize slides, bends, vibrato, and dynamic picking.",
    "Use the space between notes intentionally—rests are crucial when horizontal movement takes longer than vertical string skipping.",
    "Vary your register by sliding between the lowest and highest frets on the string to create contour in your solos.",
  ],
  metronomeSpeed: null,
  relatedSkills: ["phrasing", "improvisation"],
}; 