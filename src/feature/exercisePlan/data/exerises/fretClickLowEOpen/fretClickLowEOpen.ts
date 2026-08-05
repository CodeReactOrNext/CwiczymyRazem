import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const START_FRET = 0;
const END_FRET = 6;
const STRINGS = [6];

// Only 7 of the 12 chromatic notes actually fall inside a 7-fret single-string
// window — picking from the full NOTES array would sometimes ask for a note
// that has no valid position to click at all.
const VALID_NOTES = NOTES.filter(
  (note) => getNotePositionsInRange(NOTES.indexOf(note), START_FRET, END_FRET).some((p) => STRINGS.includes(p.string)),
);

/** Pick a random note that's actually reachable in this window, never repeating `exclude`. */
const pickNote = (exclude?: string): string => {
  const pool = exclude ? VALID_NOTES.filter((n) => n !== exclude) : VALID_NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Module-level so the chosen note survives re-renders and stays fixed between
// rotations/pauses. Re-rolled on entry and every 25s — see useNoteHuntRotation.
let currentTarget = pickNote();

export const fretClickLowEOpenExercise: Exercise = {
  id: "fret_click_low_e_open",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Low E String: Open Position — Click Drill",
  description: "A note name appears — click its spot on the low E string, frets 0 to 6.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click the cell on the low E (6th) string, between frets 0 and 6, where that note lives.",
    "Once found, a new note rolls in — no mic needed, just click.",
  ],
  tips: [
    "Count up in half-steps from the open string: E, F, F#, G, G#, A, A#.",
    "Frets 3 and 5 have inlay dots — use them as landmarks instead of counting from zero every time.",
  ],
  whyItMatters: "The low E string is the anchor for the rest of the neck — root notes for barre chords and scale shapes are measured from here. Knowing every note in the first 6 frets by sight, without playing a single note, is the fastest way to build that reference.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click this note on the low E string (frets 0-6)",
  customGoalRegion: { startFret: START_FRET, endFret: END_FRET },
  customGoalStrings: STRINGS,
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: START_FRET, endFret: END_FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
