import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const START_FRET = 6;
const END_FRET = 12;
const STRINGS = [5];

// Only 7 of the 12 chromatic notes actually fall inside a 7-fret single-string
// window — picking from the full NOTES array would sometimes ask for a note
// that has no valid position to click at all.
const VALID_NOTES = NOTES.filter(
  (note) => getNotePositionsInRange(NOTES.indexOf(note), START_FRET, END_FRET).some((p) => STRINGS.includes(p.string)),
);

const pickNote = (exclude?: string): string => {
  const pool = exclude ? VALID_NOTES.filter((n) => n !== exclude) : VALID_NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickAHighExercise: Exercise = {
  id: "fret_click_a_high",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "A String: Frets 6–12 — Click Drill",
  description: "A note name appears — click its spot on the A string, frets 6 to 12.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click the cell on the A (5th) string, between frets 6 and 12, where that note lives.",
    "Once found, a new note rolls in — no mic needed, just click.",
  ],
  tips: [
    "Fret 12 repeats the open string an octave higher (A again) — use it as your ceiling.",
    "Frets 7 and 9 have inlay dots — anchor from there instead of counting all the way from fret 6.",
  ],
  whyItMatters: "This closes the gap on the A string between the open position and the 12th-fret octave, so you can find any note on strings 5 and 6 across the whole lower half of the neck without hesitation.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click this note on the A string (frets 6-12)",
  customGoalRegion: { startFret: START_FRET, endFret: END_FRET },
  customGoalStrings: STRINGS,
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: START_FRET, endFret: END_FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
