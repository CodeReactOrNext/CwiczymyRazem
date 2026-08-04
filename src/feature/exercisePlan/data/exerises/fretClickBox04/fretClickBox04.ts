import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

const pickNote = (exclude?: string): string => {
  const pool = exclude ? NOTES.filter((n) => n !== exclude) : NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let currentTarget = pickNote();

export const fretClickBox04Exercise: Exercise = {
  id: "fret_click_box_0_4",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Click the Note — Box (Frets 0-4)",
  description: "A note name appears — click every spot inside this 5-fret box, across all 6 strings.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 1.3,
  instructions: [
    "A target note appears above the fretboard diagram.",
    "Click every cell across all 6 strings, between frets 0 and 4, where that note lives.",
    "A note typically appears 5-6 times in a box this wide — find them all.",
  ],
  tips: [
    "This 5-fret span is the same width as a movable pentatonic 'box' shape — the same box you'll use for scales and licks later.",
    "Scan string by string from low E to high e rather than jumping around at random — it's faster once it's a habit.",
  ],
  whyItMatters: "This is the first exercise where you search the entire width of the guitar at once instead of one or two strings. It's the same visual chunking used to learn scale-box shapes, so it doubles as prep for pentatonic and mode positions.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  disableMic: true,
  customGoal: currentTarget,
  customGoalDescription: "Click every spot in this box (frets 0-4, all strings)",
  customGoalRegion: { startFret: 0, endFret: 4 },
  rollHuntTarget: () => {
    currentTarget = pickNote(currentTarget);
    return { goal: currentTarget, region: { startFret: 0, endFret: 4 } };
  },
  noteHuntConfig: { rotateSeconds: 30, mode: "click" },
};
