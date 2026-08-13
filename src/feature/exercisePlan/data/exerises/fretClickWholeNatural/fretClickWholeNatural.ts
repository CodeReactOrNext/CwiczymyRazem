import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Natural notes only — the easier re-entry into a much wider (0-12) search before
// the final "every note" step brings back the full chromatic pool.
const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NATURAL_NOTES.filter((n) => n !== exclude) : NATURAL_NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickWholeNaturalExercise: Exercise = {
  id: "fret_click_whole_natural",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Click Hunt — Whole Neck, Naturals",
  description: "A natural note name appears — click every spot it occupies across the entire fretboard, frets 0 to 12.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram — always a natural note (no sharps/flats).",
    "Click every cell across all 6 strings, between frets 0 and 12, where that note lives.",
    "A natural note usually appears 6-8 times across the whole neck in this range — find them all.",
  ],
  tips: [
    "Work through the boxes you already practiced (0-4, 4-8, 8-12) in your head instead of scanning the whole neck as one blur.",
    "Remember: E-F and B-C are only a half-step apart, with no sharp/flat between them — the two spots on the neck where 'adjacent frets' really are adjacent letters.",
  ],
  whyItMatters: "This is the first exercise covering the full first-12-fret range in one go. Restricting it to natural notes for now keeps the target count manageable while you adjust to searching the whole neck at once instead of a narrow box.",
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
