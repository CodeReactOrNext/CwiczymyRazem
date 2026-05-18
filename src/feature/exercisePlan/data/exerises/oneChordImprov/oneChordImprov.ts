import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const oneChordImprovExercise: Exercise = {
  id: "one_chord_improv",
  title: "Single Chord Improvisation",
  description: "Explore the full expressive and modal potential of a static chord.",
  whyItMatters: "When the harmony doesn't change, you cannot rely on chord changes to create interest. This exercise forces you to focus on rhythm, dynamics, interval selection, and phrasing to build tension and resolution.",
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Create melodic ideas over a single, unchanging chord backing track.",
    "Focus entirely on rhythmic variety, pauses, and dynamic shifts to build tension."
  ],
  tips: [
    "Limit your note choices initially to master the expressive power of just a few pitches.",
    "Experiment with sliding, bending, and vibrato to vary the texture of your lines."
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
}; 