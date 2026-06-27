import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

// Show a root + interval ("A · Perfect 5th ↑"); the player must work out and play
// the target note. The answer (target) lives in customGoal for detection but is
// hidden on screen behind customGoalPrompt until found.

const ROOTS = ["C", "D", "E", "F", "G", "A", "B"];

const INTERVALS: { name: string; semi: number }[] = [
  { name: "Major 2nd", semi: 2 },
  { name: "Minor 3rd", semi: 3 },
  { name: "Major 3rd", semi: 4 },
  { name: "Perfect 4th", semi: 5 },
  { name: "Perfect 5th", semi: 7 },
  { name: "Minor 6th", semi: 8 },
  { name: "Major 6th", semi: 9 },
  { name: "Minor 7th", semi: 10 },
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface IntervalTarget {
  root: string;
  intervalName: string;
  target: string;
}

const roll = (exclude?: string): IntervalTarget => {
  let next: IntervalTarget;
  do {
    const root = pick(ROOTS);
    const interval = pick(INTERVALS);
    const target = NOTES[(NOTES.indexOf(root) + interval.semi) % 12];
    next = { root, intervalName: interval.name, target };
  } while (exclude && `${next.root}-${next.intervalName}` === exclude);
  return next;
};

// Module-level so the goal survives re-renders and stays fixed between rotations.
let current = roll();

export const intervalHuntExercise: Exercise = {
  id: "interval_hunt",
  addedAt: "2026-06-25",
  isHiddenFromLanding: true,
  title: "Interval Hunt",
  description: "Read a root note and an interval, then find and play the target note anywhere on the neck.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 3,
  instructions: [
    "A root note and an interval appear (e.g. 'A · Perfect 5th ↑') — work out the target note and play it.",
    "Enable Pitch Detect so the app confirms your answer; the note reveals once you nail it.",
    "A fresh interval appears every 12 seconds, so commit to an answer quickly.",
  ],
  tips: [
    "Count semitones from the root if unsure: a Perfect 5th is 7 frets up on one string.",
    "Use shapes you already know — the 5th sits 2 strings up at the same fret.",
    "Say the target note name out loud before playing it.",
    "Octave doesn't matter — play the target in whichever register is easiest.",
  ],
  whyItMatters: "Intervals are the building blocks of melody and harmony. Translating an interval into a note and finding it instantly on the neck trains the ear-to-hands link that underpins improvising and playing by ear.",
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["music_theory", "ear_training"],
  disableBackingTrack: true,
  customGoal: current.target,
  customGoalPrompt: { title: current.root, subtitle: `${current.intervalName} ↑` },
  customGoalDescription: "Play the target note (any octave)",
  rollHuntTarget: () => {
    current = roll(`${current.root}-${current.intervalName}`);
    return { goal: current.target, prompt: { title: current.root, subtitle: `${current.intervalName} ↑` } };
  },
  noteHuntConfig: { rotateSeconds: 12, mode: "interval" },
};
