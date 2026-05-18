import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const naturalNotesMapExercise: Exercise = {
  id: "natural_notes_map",
  title: "Natural Notes Map",
  description:
    "Visualize and map all natural notes across the entire fretboard.",
  whyItMatters: "Learning natural note positions provides a reliable grid for the entire fretboard. Once natural notes are memorized, locating sharps and flats becomes a simple, immediate adjustment.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 5,
  instructions: [
    "Locate and play natural notes systematically up and down the neck.",
    "Focus on direct spatial memory rather than calculating distances from markers."
  ],
  tips: [
    "Group notes by octaves to build a reliable mental grid of the fretboard.",
    "Practice naming note locations mentally during your daily warm-up."
  ],
  metronomeSpeed: {
    min: 40,
    max: 150,
    recommended: 50,
  },
  relatedSkills: ["music_theory"],
};
