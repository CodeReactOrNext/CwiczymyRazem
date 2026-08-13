import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickOctavesBeHighExercise: Exercise = {
  id: "fret_click_octaves_be_high",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Click Hunt — B & e, Frets 6–12",
  description: "A note name appears — click every spot on the B and high e strings, frets 6 to 12, where it lands.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell on the B (2nd) and high e (1st) strings, between frets 6 and 12, where that note lives.",
    "The note may appear once, twice, or not at all in this window — find every occurrence there is.",
  ],
  tips: [
    "Fret 12 repeats the open string an octave higher on both strings — B on the B string, E on the high e string.",
    "This is where most solo bends and high melodic phrases live — worth knowing cold.",
  ],
  whyItMatters: "Completes full coverage of the top two strings across the first 12 frets — the register where the vast majority of guitar solos actually happen. Combined with the open-position drill, you now know both strings end to end.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every spot on the B & high e strings (frets 6-12)",
  customGoalRegion: { startFret: 6, endFret: 12 },
  customGoalStrings: [2, 1],
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: 6, endFret: 12 } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
