import type { Exercise } from "feature/exercisePlan/types/exercise.types";


export const chordPracticeExercise: Exercise = {
  id: "chord_practice_configurable",
  title: "Chord Practice (Configurable)",
  description: "Practice clean transitions and finger placement across a customizable selection of chords.",
  whyItMatters: "Mastering transitions between diverse chord families is essential for smooth rhythm playing. This exercise builds muscle memory and hand independence, ensuring all strings ring clearly without unintended muting.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Position your thumb behind the middle of the neck to support a curved fretting arch.",
    "Arpeggiate each chord slowly to verify that every string rings out clearly."
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
