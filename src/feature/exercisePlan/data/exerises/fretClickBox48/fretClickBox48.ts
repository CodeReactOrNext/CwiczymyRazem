import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickBox48Exercise: Exercise = {
  id: "fret_click_box_4_8",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Box: Frets 4–8 — Click Drill",
  description: "A note name appears — click every spot inside this 5-fret box, across all 6 strings.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell across all 6 strings, between frets 4 and 8, where that note lives.",
    "A note typically appears 5-6 times in a box this wide — find them all.",
  ],
  tips: [
    "This box contains frets 5 and 7 — the two single-dot inlays — use them to orient instantly.",
    "This is roughly the 5th-fret pentatonic box position (A minor pentatonic box 1) — recognizable if you've already learned that shape.",
  ],
  whyItMatters: "The middle of the neck is where open-position habits stop working and pure fretboard knowledge takes over — there's no open string to count from nearby. This box builds that mid-neck fluency.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every spot in this box (frets 4-8, all strings)",
  customGoalRegion: { startFret: 4, endFret: 8 },
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: 4, endFret: 8 } };
  },
  noteHuntConfig: { rotateSeconds: 30, mode: "click" },
};
