import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const START_FRET = 0;
const END_FRET = 12;
const STRINGS = [4];

// A full 0-12 window on one string holds all 12 chromatic notes, so the whole
// NOTES array is fair game — no reachability filter needed here.
const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Module-level so the chosen note survives re-renders and stays fixed between
// rotations/pauses. Re-rolled on entry and every 25s — see useNoteHuntRotation.
let currentTarget = pickNote();

export const fretClickDFullExercise: Exercise = {
  id: "fret_click_d_full",
  addedAt: "2026-08-11",
  isHiddenFromLanding: true,
  title: "Click Hunt — D String, Frets 0–12",
  description: "A note name appears — click every spot on the D string, frets 0 to 12, where it lands.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell on the D (4th) string, between frets 0 and 12, where that note lives.",
    "Only D itself shows up twice — open and fret 12. Every other note has exactly one home in this window.",
  ],
  tips: [
    "Count up in half-steps from the open string: D, D#, E, F, F#, G, G#, A, A#, B, C, C#, back to D at fret 12.",
    "Fret 5 is G, the same pitch as the open G string — a free checkpoint halfway up.",
    "Frets 3, 5, 7 and 9 carry inlay dots (F, G, A, B) — anchor from the nearest one instead of counting from the nut.",
  ],
  whyItMatters: "The D string sits in the middle of the neck, so it turns up in nearly every chord shape and scale box you play. Covering the full octave in one drill means you stop thinking in 'lower half' and 'upper half' and just know the string.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click this note on the D string (frets 0-12)",
  customGoalRegion: { startFret: START_FRET, endFret: END_FRET },
  customGoalStrings: STRINGS,
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: START_FRET, endFret: END_FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
