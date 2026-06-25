import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

// Full chromatic pool (includes sharps) — the medium step up from the natural-note
// Random Note Hunt: accidentals are the least-mapped spots on the fretboard.
/** Pick a random chromatic note, never repeating `exclude` so rotations always change. */
const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Module-level so the chosen note survives re-renders and stays fixed between
// rotations/pauses. Re-rolled on entry and every 20s — see useNoteHuntRotation.
let currentTarget = pickNote();

export const chromaticNoteHuntExercise: Exercise = {
  id: "chromatic_note_hunt",
  isHiddenFromLanding: true,
  title: "Chromatic Note Hunt",
  description: "Find every occurrence of a note across the neck — now with sharps and flats, on a faster clock.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 3,
  instructions: [
    "A target note appears and changes every 20 seconds — it can now be a sharp/flat (e.g. F#, A#).",
    "Enable Pitch Detect so the app verifies each hit and tracks which octaves you've found.",
    "Find and play the note on every string and in every octave before the timer rotates.",
  ],
  tips: [
    "Sharps sit one fret above their natural note — anchor off the natural you already know.",
    "Say the full note name out loud as you play it, including 'sharp'.",
    "Use octave shapes (2 strings up + 2 frets up) to jump between octaves quickly.",
    "Don't worry about rhythm; focus on accuracy and speed of location.",
  ],
  whyItMatters: "Adding accidentals forces full chromatic command of the neck, not just the natural notes. The faster rotation builds quick recall under mild time pressure — the bridge from knowing the fretboard to using it in real time.",
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  customGoal: currentTarget,
  customGoalDescription: "Find this note on every string & octave",
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget };
  },
  noteHuntConfig: { rotateSeconds: 20 },
};
