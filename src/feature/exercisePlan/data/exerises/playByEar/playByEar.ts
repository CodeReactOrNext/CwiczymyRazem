import type { Exercise } from "feature/exercisePlan/types/exercise.types";


export const playByEarExercise: Exercise = {
  id: "play_by_ear",
  title: "Playing By Ear",
  description: "Exercise developing the ability to listen and reproduce music without sheet music.",
  difficulty: "medium",
  category: "hearing",
  timeInMinutes: 15,
  instructions: [
    "Choose a simple riff or song fragment, preferably from a genre you're familiar with.",
    "Listen to the fragment several times, focusing first on rhythm and structure.",
    "Slowly reproduce the fragment on guitar, correcting mistakes and adjusting your playing.",
    "Repeat until you're satisfied with the result or until the end of the exercise time."
  ],
  tips: [
    "Start with simple, single-line riffs - avoid complicated pieces at the beginning.",
    "Use technology - apps allowing song slowdown or isolating fragments can be helpful.",
    "Sing the notes you hear before playing them on guitar - this helps internalize the sounds.",
    "Don't be afraid to experiment on different strings and positions to find the right notes.",
  
  ],
  metronomeSpeed: null,
  relatedSkills: ["ear_training", "transcription"],
}; 