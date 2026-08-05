import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickOctavesBeOpenExercise: Exercise = {
  id: "fret_click_octaves_be_open",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "B & High e Strings: Open Position — Click Drill",
  description: "A note name appears — click every spot on the B and high e strings, frets 0 to 6, where it lands.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell on the B (2nd) and high e (1st) strings, between frets 0 and 6, where that note lives.",
    "The note may appear once, twice, or not at all in this window — find every occurrence there is.",
  ],
  tips: [
    "The B and high e strings are the only pair tuned a major third apart instead of a perfect fourth — everything sits one fret closer together here than on the other string pairs.",
    "Work out the B-string spot first (B, C, C#, D, D#, E, F), then the e-string spot (E, F, F#, G, G#, A, A#).",
  ],
  whyItMatters: "The top two strings carry most melodies and lead lines, and their tuning quirk (major third instead of perfect fourth) trips up players who assume every string pair behaves the same. This drill forces you to learn this pair on its own terms.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every spot on the B & high e strings (frets 0-6)",
  customGoalRegion: { startFret: 0, endFret: 6 },
  customGoalStrings: [2, 1],
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: 0, endFret: 6 } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
