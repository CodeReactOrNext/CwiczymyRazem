import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const FRET = 9;

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

export const fretClickFret9AllExercise: Exercise = {
  id: "fret_click_fret9_all",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  isHiddenFromLibrary: true,
  title: "Click the Note — Fret 9 (All Strings)",
  description: "A note name appears — click every string where it lands exactly on fret 9.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every string (out of all 6) where that note falls on fret 9.",
    "A note can appear on more than one string at fret 9 — find all of them before the next one rolls in.",
  ],
  tips: [
    "Fret 9 sits right before the double-dot 12th-fret octave marker — use fret 12 as a backwards reference (3 frets down).",
    "Both E strings (low and high) land on the same note at fret 9, since they're tuned two octaves apart.",
  ],
  whyItMatters: "Fret 9 completes the trio of inlay-marked reference frets (5, 7, 9) that split the first octave of the neck into easy checkpoints. With all three mapped across every string, you can locate any note in the first 12 frets by triangulating from the nearest landmark instead of counting from zero.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every string where this note lands on fret 9",
  customGoalRegion: { startFret: FRET, endFret: FRET },
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: FRET, endFret: FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
