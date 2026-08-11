import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const START_FRET = 0;
const END_FRET = 12;
const STRINGS = [3];

// A full 0-12 window on one string holds all 12 chromatic notes, so the whole
// NOTES array is fair game — no reachability filter needed here.
const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Module-level so the chosen note survives re-renders and stays fixed between
// rotations/pauses. Re-rolled on entry and every 25s — see useNoteHuntRotation.
let currentTarget = pickNote();

export const fretClickGFullExercise: Exercise = {
  id: "fret_click_g_full",
  addedAt: "2026-08-11",
  isHiddenFromLanding: true,
  title: "G String: Frets 0–12 — Click Drill",
  description: "A note name appears — click every spot on the G string, frets 0 to 12, where it lands.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell on the G (3rd) string, between frets 0 and 12, where that note lives.",
    "Only G itself shows up twice — open and fret 12. Every other note has exactly one home in this window.",
  ],
  tips: [
    "Count up in half-steps from the open string: G, G#, A, A#, B, C, C#, D, D#, E, F, F#, back to G at fret 12.",
    "The G string breaks the tuning pattern — fret 4 (not fret 5) is B, the same pitch as the open B string.",
    "Fret 9 is E, the root of the most-played minor pentatonic box up here — worth memorising on its own.",
  ],
  whyItMatters: "The G string is where the guitar's tuning gap shrinks to a major third, so shapes learned lower down shift by a fret once they cross onto it. Knowing the whole string by name is what keeps that irregularity from tripping you up mid-phrase.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click this note on the G string (frets 0-12)",
  customGoalRegion: { startFret: START_FRET, endFret: END_FRET },
  customGoalStrings: STRINGS,
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: START_FRET, endFret: END_FRET } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
