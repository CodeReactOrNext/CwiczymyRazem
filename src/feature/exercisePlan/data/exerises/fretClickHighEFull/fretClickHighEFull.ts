import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const START_FRET = 0;
const END_FRET = 12;
const STRINGS = [1];

// A full 0-12 window on one string holds all 12 chromatic notes, so the whole
// NOTES array is fair game — no reachability filter needed here.
const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Module-level so the chosen note survives re-renders and stays fixed between
// rotations/pauses. Re-rolled on entry and every 25s — see useNoteHuntRotation.
let currentTarget = pickNote();

export const fretClickHighEFullExercise: Exercise = {
  id: "fret_click_high_e_full",
  addedAt: "2026-08-11",
  isHiddenFromLanding: true,
  title: "High e String: Frets 0–12 — Click Drill",
  description: "A note name appears — click every spot on the high e string, frets 0 to 12, where it lands.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell on the high e (1st) string, between frets 0 and 12, where that note lives.",
    "Only E itself shows up twice — open and fret 12. Every other note has exactly one home in this window.",
  ],
  tips: [
    "It's the same set of notes as the low E string, two octaves up — if you know one, you already know the other.",
    "Count up in half-steps from the open string: E, F, F#, G, G#, A, A#, B, C, C#, D, D#, back to E at fret 12.",
    "E to F (fret 0 to 1) is a half-step with nothing between them — same for B to C at frets 7 and 8.",
  ],
  whyItMatters: "The high e string is a free copy of the low E you already know, which makes it the fastest win on the neck — and it's the string most melodies and solo peaks land on. Finishing it means every single string is covered end to end.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click this note on the high e string (frets 0-12)",
  customGoalRegion: { startFret: START_FRET, endFret: END_FRET },
  customGoalStrings: STRINGS,
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: START_FRET, endFret: END_FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
