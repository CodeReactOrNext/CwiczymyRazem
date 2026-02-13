import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const oneChordImprovExercise: Exercise = {
  id: "one_chord_improv",
  title: "Single Chord Improvisation",
  description: "Exercise developing creativity and harmonic understanding through improvisation over a single, unchanging chord.",
  difficulty: "medium",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Choose one chord (e.g., Dmaj7, G7, Am9) or record a simple chord loop. You can also use any backing track.",
    "Identify scale or scales that match your chosen chord.",
    "For the first 2 minutes, improvise using only chord tones (root, third, fifth, seventh).",
    "For the next 4 minutes, add scale tones (second, fourth, sixth, ninth).",
    "In the final minutes, experiment with outside notes as passing tones and tension builders."
  ],
  tips: [
    "Don't try to play too many notes - sometimes one well-chosen note has more expressive power.",
    "Notice how different scale tones create different tensions over the chord.",
    "Experiment with different guitar registers - the same notes have different character in different octaves.",
    "Think of your improvisation as a story - with beginning, development and ending.",
    "Experiment with rhythm - even on one chord, changing rhythm can create a sense of development."
  ],
  metronomeSpeed: null,
  relatedSkills: ["improvisation", "phrasing"],
}; 