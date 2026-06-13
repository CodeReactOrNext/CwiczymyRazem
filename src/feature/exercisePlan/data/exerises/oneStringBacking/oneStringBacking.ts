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
    "Pick one string and improvise over the backing track using only that string.",
    "Move along the string to find the notes that sound good — slide between them instead of jumping.",
    "Leave space between phrases: play a short idea, let it breathe, then answer it."
  ],
  tips: [
    "Use slides, bends, and vibrato to make single notes expressive — that's what keeps one string interesting.",
    "Listen to the backing track and aim to land on notes that fit the chord underneath.",
    "Start with just 2-3 notes and a simple rhythm; add range only once it feels musical."
  ],
  metronomeSpeed: null,
  relatedSkills: ["phrasing", "improvisation"],
}; 