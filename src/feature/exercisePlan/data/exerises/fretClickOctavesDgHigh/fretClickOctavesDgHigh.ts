import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickOctavesDgHighExercise: Exercise = {
  id: "fret_click_octaves_dg_high",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Click the Note — D & G Strings (Upper)",
  description: "A note name appears — click every spot on the D and G strings, frets 6 to 12, where it lands.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell on the D (4th) and G (3rd) strings, between frets 6 and 12, where that note lives.",
    "The note may appear once, twice, or not at all in this window — find every occurrence there is.",
  ],
  tips: [
    "Fret 12 repeats the open string an octave higher on both strings — D on the D string, G on the G string — use those as your ceiling landmarks.",
    "This window overlaps a lot of the same pitches as frets 0-6 shifted up 12 frets — if you know the open-position version, transpose it by adding an octave.",
  ],
  whyItMatters: "Extends the two-string scanning skill from the open position into the upper neck, where most lead lines and solos actually happen. By now you should be able to find the D+G pair anywhere on the neck, not just near the nut.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every spot on the D & G strings (frets 6-12)",
  customGoalRegion: { startFret: 6, endFret: 12 },
  customGoalStrings: [4, 3],
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: 6, endFret: 12 } };
  },
  noteHuntConfig: { rotateSeconds: 25, mode: "click" },
};
