import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const twoNotesPerBarPhrasingExercise: Exercise = {
  id: "two_notes_per_bar_phrasing",
  title: "Two-Notes-Per-Bar Phrasing",
  description:
    "Create expressive phrases restricted to exactly two notes per measure.",
  whyItMatters: "When notes are extremely limited, you must focus entirely on timing, tone, vibrato, and silence. This drill builds incredible phrasing discipline, making every note you choose count.",
  difficulty: "easy",
  category: "creativity",
  timeInMinutes: 10,
  instructions: [
    "Select exactly two notes per bar, focusing on their rhythmic placement.",
    "Let each note ring out fully, applying expressive vibrato or bending."
  ],
  tips: [
    "Embrace the silence—rests are just as important as the notes you play.",
    "Vary the length and dynamic accent of your two notes to create contrast."
  ],
  metronomeSpeed: null,
  relatedSkills: ["phrasing", "improvisation"],
};
