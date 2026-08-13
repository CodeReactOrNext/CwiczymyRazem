import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickWholeChromaticExercise: Exercise = {
  id: "fret_click_whole_chromatic",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Click Hunt — Whole Neck, All Notes",
  description: "Any note — natural or sharp/flat — appears. Click every spot it occupies across the entire fretboard, frets 0 to 12.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram — this time it can be any of the 12 chromatic notes, including sharps/flats.",
    "Click every cell across all 6 strings, between frets 0 and 12, where that note lives.",
    "This is full mastery mode — no restrictions, no narrow window, the whole neck is in play.",
  ],
  tips: [
    "Sharps sit exactly one fret above their natural neighbor — if you know where the natural is, the sharp is right next to it.",
    "If you're stuck, fall back to the fret-5/7/9 landmarks and the boxes you already trained — they still apply here, just combined.",
  ],
  whyItMatters: "This is the full-difficulty version of the whole-neck drill: every note, every string, the complete first 12 frets. Clearing this consistently means you genuinely know the fretboard — the last checkpoint before the live playing exam.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every spot on the whole neck (frets 0-12)",
  customGoalRegion: { startFret: 0, endFret: 12 },
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: 0, endFret: 12 } };
  },
  noteHuntConfig: { rotateSeconds: 35, mode: "click" },
};
