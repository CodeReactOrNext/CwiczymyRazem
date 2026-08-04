import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const FRET = 5;

// A single fret across all 6 strings only reaches ~5 of the 12 chromatic notes
// (several strings land on the same pitch class here) — picking from the full
// NOTES array would sometimes ask for a note with no valid position at all.
const VALID_NOTES = NOTES.filter(
  (note) => getNotePositionsInRange(NOTES.indexOf(note), FRET, FRET).length > 0,
);

const pickNote = (exclude?: string): string => {
  const pool = exclude ? VALID_NOTES.filter((n) => n !== exclude) : VALID_NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickFret5AllExercise: Exercise = {
  id: "fret_click_fret5_all",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  isHiddenFromLibrary: true,
  title: "Click the Note — Fret 5 (All Strings)",
  description: "A note name appears — click every string where it lands exactly on fret 5.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every string (out of all 6) where that note falls on fret 5.",
    "A note can appear on more than one string at fret 5 — find all of them before the next one rolls in.",
  ],
  tips: [
    "On strings 6, 5 and 4 (low E, A, D), fret 5 sounds the same pitch as the open string just above it — that's how guitarists tune by ear.",
    "The G string is the exception: it needs fret 4, not fret 5, to reach the open B string above it — the guitar's one 'irregular' string gap.",
  ],
  whyItMatters: "Scanning a single fret across all six strings trains you to see the fretboard as a grid instead of six separate strings. Fret 5 also carries the tuning-by-ear trick, so this drill doubles as ear-training scaffolding.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every string where this note lands on fret 5",
  customGoalRegion: { startFret: FRET, endFret: FRET },
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: FRET, endFret: FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
