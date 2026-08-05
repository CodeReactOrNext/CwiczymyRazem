import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickBox812Exercise: Exercise = {
  id: "fret_click_box_8_12",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Box: Frets 8–12 — Click Drill",
  description: "A note name appears — click every spot inside this 5-fret box, across all 6 strings.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell across all 6 strings, between frets 8 and 12, where that note lives.",
    "A note typically appears 5-6 times in a box this wide — find them all.",
  ],
  tips: [
    "Fret 12 is the octave marker (double dot) — every open string repeats there, so you can work backwards from a note you already know at fret 0.",
    "Fret 9 has a single-dot inlay too — use frets 9 and 12 as your two landmarks in this box.",
  ],
  whyItMatters: "Closes the loop on the first 12 frets — once you can find any note in this box, you've covered every fret from the nut to the octave marker, on every string, in three overlapping 5-fret chunks.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every spot in this box (frets 8-12, all strings)",
  customGoalRegion: { startFret: 8, endFret: 12 },
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: 8, endFret: 12 } };
  },
  noteHuntConfig: { rotateSeconds: 30, mode: "click" },
};
