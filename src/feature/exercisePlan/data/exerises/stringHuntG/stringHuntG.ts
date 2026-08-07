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

export const stringHuntGExercise: Exercise = {
  // Renamed from "String Sweep" (too close to sweep picking) — the id keeps the
  // old wording on purpose: favorites, quests and records in Firestore key off it.
  id: "string_sweep_g",
  addedAt: "2026-08-03",
  isHiddenFromLanding: true,
  title: "String Hunt — G",
  description: "Beat the clock: play every one of the 12 notes on the G string within 90 seconds, at 60 BPM.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 1.5,
  instructions: [
    "A note name appears — find and play it on the G (3rd) string, anywhere in frets 0–11.",
    "As soon as you hit it, the next note rolls in automatically — no need to wait.",
    "You have exactly 90 seconds. The exam ends automatically when time runs out and scores whatever you completed.",
  ],
  tips: [
    "Pitch detection can't tell which string you plucked, but it does hear the octave — and inside frets 0–11 the G string holds each note in exactly one octave. Grab the same note on another string and it lands in the wrong octave, so it won't count.",
    "Frets 0–11 cover the full chromatic octave exactly once per string — no repeats, no gaps.",
    "Lean on the fret-5/7/9 landmarks from earlier in this journey to jump straight to a note instead of counting from open string.",
  ],
  whyItMatters: "This is the real test: not clicking a diagram, but finding and playing every note on this string live, under time pressure. It's the transfer from knowing the fretboard to using it.",
  metronomeSpeed: { min: 60, max: 60, recommended: 60 },
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  customGoal: currentTarget,
  customGoalDescription: "Play this note on the G string (frets 0–11)",
  customGoalRegion: { startFret: 0, endFret: 11 },
  customGoalStrings: [3],
  rollHuntTarget: () => {
    if (queue.length === 0) queue = shuffle(NOTES);
    currentTarget = queue.shift()!;
    return { goal: currentTarget, region: { startFret: 0, endFret: 11 } };
  },
  noteHuntConfig: { rotateSeconds: 8, mode: "accumulate" },
};
