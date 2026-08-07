import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

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

export const stringSweepBExercise: Exercise = {
  id: "string_sweep_b",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "String Sweep — B",
  description: "Beat the clock: play every one of the 12 notes on the B string within 90 seconds, at 60 BPM.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 1.5,
  instructions: [
    "A note name appears — find and play it on the B (2nd) string, anywhere in frets 0–11.",
    "As soon as you hit it, the next note rolls in automatically — no need to wait.",
    "You have exactly 90 seconds. The exam ends automatically when time runs out and scores whatever you completed.",
  ],
  tips: [
    "Pitch detection hears the note, not the string — it can't literally verify you played it on the B string specifically. Use this exercise honestly, the same way you would with a teacher watching.",
    "Frets 0–11 cover the full chromatic octave exactly once per string — no repeats, no gaps.",
    "Remember: the B string is the one tuned a major third from its neighbor, so its fret-5 'tuning trick' doesn't apply the same way — rely on the landmarks, not the shortcut.",
  ],
  whyItMatters: "This is the real test: not clicking a diagram, but finding and playing every note on this string live, under time pressure. It's the transfer from knowing the fretboard to using it.",
  metronomeSpeed: { min: 60, max: 60, recommended: 60 },
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  customGoal: currentTarget,
  customGoalDescription: "Play this note on the B string (frets 0–11)",
  customGoalRegion: { startFret: 0, endFret: 11 },
  rollHuntTarget: () => {
    if (queue.length === 0) queue = shuffle(NOTES);
    currentTarget = queue.shift()!;
    return { goal: currentTarget, region: { startFret: 0, endFret: 11 } };
  },
  noteHuntConfig: { rotateSeconds: 8, mode: "sweep" },
};
