import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const START_FRET = 0;
const END_FRET = 12;
const STRINGS = [2];

// A full 0-12 window on one string holds all 12 chromatic notes, so the whole
// NOTES array is fair game — no reachability filter needed here.
const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Module-level so the chosen note survives re-renders and stays fixed between
// rotations/pauses. Re-rolled on entry and every 25s — see useNoteHuntRotation.
let currentTarget = pickNote();

export const fretClickBFullExercise: Exercise = {
  id: "fret_click_b_full",
  addedAt: "2026-08-11",
  isHiddenFromLanding: true,
  title: "B String: Frets 0–12 — Click Drill",
  description: "A note name appears — click every spot on the B string, frets 0 to 12, where it lands.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell on the B (2nd) string, between frets 0 and 12, where that note lives.",
    "Only B itself shows up twice — open and fret 12. Every other note has exactly one home in this window.",
  ],
  tips: [
    "Count up in half-steps from the open string: B, C, C#, D, D#, E, F, F#, G, G#, A, A#, back to B at fret 12.",
    "B to C is a half-step with nothing in between, so the open string and fret 1 are neighbouring letters — the only string where that happens right at the nut.",
    "Frets 7 and 9 carry inlay dots (F# and G#) — anchor from the nearest dot instead of counting from the nut every time.",
  ],
  whyItMatters: "The B string carries the top voice of most open and barre chords low down, and the bent melody notes higher up. Reading it by name instead of by shape is what lets you re-voice a chord or pick a bend target on the fly.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click this note on the B string (frets 0-12)",
  customGoalRegion: { startFret: START_FRET, endFret: END_FRET },
  customGoalStrings: STRINGS,
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: START_FRET, endFret: END_FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
