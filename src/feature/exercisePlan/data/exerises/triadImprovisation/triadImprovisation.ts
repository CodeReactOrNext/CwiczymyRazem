import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const triadImprovisationExercise: Exercise = {
  id: "triad_improvisation",
  title: "Triad Improvisation",
  description: "Improvise solos purely using three-note triad shapes.",
  whyItMatters: "Limiting yourself to triads forces you to learn chord shapes inside out and connect them melodically across the neck. It prevents you from playing mindless scale runs and makes your solos sound highly structured.",
  difficulty: "hard",
  category: "creativity",
  timeInMinutes: 12,
  instructions: [
    "Construct melodic phrases using only the notes of the active triad shapes.",
    "Connect adjacent triad shapes smoothly as you improvise."
  ],
  tips: [
    "Focus on rhythmic phrasing and dynamics to make the limited note selection interesting.",
    "Use slides and bends to connect triad shapes across the neck."
  ],
  metronomeSpeed: null,
  relatedSkills: ["harmony", "improvisation", "chords", ],
}; 