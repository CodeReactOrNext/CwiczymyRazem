import type { Exercise } from "feature/exercisePlan/types/exercise.types";


export const chordPracticeExercise: Exercise = {
  id: "chord_practice_configurable",
  title: "Chord Practice (Configurable)",
  description: "Choose your chords and timing to practice transitions with a metronome.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "This is a configurable chord practice exercise.",
    "When you start, you'll be able to choose:",
    "• Chords to include in the loop",
    "• How often to change chords",
    "• Whether to show notes (frets) in the tablature",
    "• Target tempo",
    "The system will generate a custom practice session for you."
  ],
  tips: [
    "Focus on smooth transitions — don't stop the rhythm between chords.",
    "If a transition is hard, slow down the BPM until it's easy.",
    "Try 'not reading notes' mode to develop your memory and ear.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 180,
    recommended: 80
  },
  relatedSkills: ["chords"],
  tablature: undefined
};
