import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickOctavesDgOpenExercise: Exercise = {
  id: "fret_click_octaves_dg_open",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Click Hunt — D & G, Frets 0–6",
  description: "A note name appears — click every spot on the D and G strings, frets 0 to 6, where it lands.",
  difficulty: "easy",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell on the D (4th) and G (3rd) strings, between frets 0 and 6, where that note lives.",
    "The note may appear once, twice, or not at all in this window — find every occurrence there is.",
  ],
  tips: [
    "Work out the D-string spot first (D, D#, E, F, F#, G, G# for frets 0-6), then the G-string spot (G, G#, A, A#, B, C, C# for frets 0-6) — they rarely land on the same fret.",
    "When a note shows up on both strings, notice the exact fret gap between them — that's the real, memorizable distance for that specific note pair, not a fixed formula.",
  ],
  whyItMatters: "Scanning two neighboring strings at once for the same note name is a different skill than scanning one string alone — it's what real playing demands when a lick jumps strings mid-phrase. This is your first two-string search after mastering single strings in Fundamentals.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every spot on the D & G strings (frets 0-6)",
  customGoalRegion: { startFret: 0, endFret: 6 },
  customGoalStrings: [4, 3],
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: 0, endFret: 6 } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
