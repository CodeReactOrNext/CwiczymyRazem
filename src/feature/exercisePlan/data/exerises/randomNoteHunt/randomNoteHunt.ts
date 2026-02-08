import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const getRandomNote = () => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return notes[Math.floor(Math.random() * notes.length)];
};

let cachedNote: string | null = null;
let lastAccess = 0;

const getStableRandomNote = () => {
  const now = Date.now();
  if (!cachedNote || now - lastAccess > 1000) {
    cachedNote = getRandomNote();
  }
  lastAccess = now;
  return cachedNote;
};

export const randomNoteHuntExercise: Exercise = {
  id: "random_note_hunt",
  get title() {
    return `Random Note Hunt: ${getStableRandomNote()}`;
  },
  get customGoal() {
    return getStableRandomNote();
  },
  customGoalDescription: "Find this note everywhere on the neck",
  description: "Improve your fretboard knowledge by finding all occurrences of the selected note across the neck.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 3,
  instructions: [
    "Find and play the selected note on every string where it occurs, starting from the low E string and moving up.",
    "Repeat the process, but this time start from the highest string and move down.",
    "Try to find the note in different octaves.",
  ],
  tips: [
    "Use octaves to help you find notes faster (e.g., 2 strings up and 2 frets up).",
    "Say the name of the note out loud as you play it.",
    "Don't worry about rhythm; focus on accuracy and speed of location.",
    "Try to visualize the note on the fretboard before you play it."
  ],
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
};
