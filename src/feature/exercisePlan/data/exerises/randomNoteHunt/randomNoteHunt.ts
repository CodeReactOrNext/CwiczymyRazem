import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const randomNoteHuntExercise: Exercise = {
  id: "random_note_hunt",
  isHiddenFromLanding: true,
  title: "Random Note Hunt",
  description: "Improve your fretboard knowledge by finding all occurrences of a chosen note across the neck.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 2,
  instructions: [
    "Pick a note, then find and play it on every string where it occurs, starting from the low E string and moving up.",
    "Repeat the process, but this time start from the highest string and move down.",
    "Try to find the note in different octaves.",
  ],
  tips: [
    "Use octaves to help you find notes faster (e.g., 2 strings up and 2 frets up).",
    "Say the name of the note out loud as you play it.",
    "Don't worry about rhythm; focus on accuracy and speed of location.",
    "Try to visualize the note on the fretboard before you play it."
  ],
  whyItMatters: "This exercise improves fretboard knowledge by training you to quickly locate the same note across different strings and octaves. It helps build faster note recognition and better navigation across the neck.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
};
