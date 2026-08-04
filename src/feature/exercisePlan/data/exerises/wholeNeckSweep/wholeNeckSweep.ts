import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

/** Fisher-Yates shuffle — used to build a "no repeats until every note has appeared" bag. */
const shuffle = (arr: string[]): string[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

let queue: string[] = shuffle(NOTES);
let currentTarget = queue.shift()!;

export const wholeNeckSweepExercise: Exercise = {
  id: "whole_neck_sweep",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "Whole Neck Sweep",
  description: "The final exam: beat the clock and play every one of the 12 notes, anywhere on the neck, within 90 seconds at 60 BPM.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 1.5,
  instructions: [
    "A note name appears — find and play it anywhere on the neck, on any string, in any octave you can reach.",
    "As soon as you hit it, the next note rolls in automatically — no need to wait.",
    "You have exactly 90 seconds. The exam ends automatically when time runs out and scores whatever you completed.",
  ],
  tips: [
    "No region, no single string this time — the whole fretboard is fair game, just like real playing.",
    "If a note is taking too long, jump to the string/fret you're most confident about instead of hunting blindly.",
  ],
  whyItMatters: "This closes the Fretboard Mastery path: no diagram, no single-string focus, just you, the clock, and the whole neck. If you can sweep all 12 notes here, you've genuinely internalized the fretboard.",
  metronomeSpeed: { min: 60, max: 60, recommended: 60 },
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  customGoal: currentTarget,
  customGoalDescription: "Play this note anywhere on the neck",
  rollHuntTarget: () => {
    if (queue.length === 0) queue = shuffle(NOTES);
    currentTarget = queue.shift()!;
    return { goal: currentTarget };
  },
  noteHuntConfig: { rotateSeconds: 8, mode: "sweep" },
};
