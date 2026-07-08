import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Beginner-friendly pool: natural notes only (no sharps/flats) so the hunt stays
// approachable for someone still learning the fretboard.
const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];

/** Pick a random natural note, never repeating `exclude` so rotations always change. */
const pickNote = (exclude?: string): string => {
  const pool = exclude ? NATURAL_NOTES.filter((n) => n !== exclude) : NATURAL_NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Module-level so the chosen note survives re-renders and stays fixed between
// rotations/pauses. Re-rolled on entry and every 30s — see useNoteHuntRotation.
let currentTarget = pickNote();

export const randomNoteHuntExercise: Exercise = {
  id: "random_note_hunt",
  isHiddenFromLanding: true,
  title: "Random Note Hunt",
  description: "Improve your fretboard knowledge by finding all occurrences of a chosen note across the neck.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 2,
  instructions: [
    "A target note appears on screen and changes every 30 seconds — find and play it on every string where it occurs.",
    "Enable Pitch Detect so the app verifies each hit and tracks which octaves you've found.",
    "Start from the low E string and move up, then try finding the note in different octaves before the timer rotates.",
  ],
  tips: [
    "Use octaves to help you find notes faster (e.g., 2 strings up and 2 frets up).",
    "Say the name of the note out loud as you play it.",
    "Don't worry about rhythm; focus on accuracy and speed of location.",
    "Try to visualize the note on the fretboard before you play it."
  ],
  whyItMatters: "This exercise improves fretboard knowledge by training you to quickly locate the same note across different strings and octaves. It helps build faster note recognition and better navigation across the neck.",
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  // Static value only gates rendering / first paint; the live rotating target is
  // owned by useNoteHuntRotation via rollHuntTarget (survives object spreads).
  customGoal: currentTarget,
  customGoalDescription: "Find this note on every string & octave",
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget };
  },
  noteHuntConfig: { rotateSeconds: 30 },
};
