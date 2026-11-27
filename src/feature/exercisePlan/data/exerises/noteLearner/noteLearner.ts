import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

import { type NoteLearnerNotes, type NoteLearnerStrings, useNoteLearnerStore } from "./noteLearnerStore";

const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];

/** One string: frets 0â€“11 hold every note exactly once, so each target has one
 *  spot. The whole neck runs to the 12th, the landmark the player counts from. */
export function noteLearnerRegion(strings: NoteLearnerStrings) {
  return { startFret: 0, endFret: strings === "all" ? 12 : 11 };
}

const shuffle = (notes: readonly string[]): string[] => {
  const bag = [...notes];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

// A bag, not a dice roll: every note of the pool comes up once before any comes
// back, so a pass over a string really covers the whole string. Module-level so
// the sequence survives the exercise object being spread and re-rendered.
let bag: string[] = [];
let bagPool: NoteLearnerNotes | null = null;
let lastNote: string | null = null;

/** Next note from the bag for `pool`, never the one just asked. Exported for tests. */
export function nextLearnerNote(pool: NoteLearnerNotes): string {
  if (bagPool !== pool || bag.length === 0) {
    bag = shuffle(pool === "all" ? NOTES : NATURAL_NOTES);
    bagPool = pool;
    // A fresh bag can open on the note that closed the last one.
    if (bag[0] === lastNote && bag.length > 1) bag.push(bag.shift()!);
  }
  lastNote = bag.shift()!;
  return lastNote;
}

function rollTarget() {
  const { strings, notes } = useNoteLearnerStore.getState();
  return {
    goal: nextLearnerNote(notes),
    region: noteLearnerRegion(strings),
    strings: strings === "all" ? undefined : [strings],
  };
}

const firstTarget = rollTarget();

/**
 * The note name and the neck, nothing else: the player finds the spot from
 * memory on the string and notes they picked, and the next note waits until
 * the mic has heard this one.
 */
export const noteRecallExercise: Exercise = {
  id: "note_recall",
  addedAt: "2026-11-27",
  isHiddenFromLanding: true,
  title: "Note Hunt â€” Recall Mode",
  description: "See a note name, find it on the string you picked and play it. No markers, no timer.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 3,
  instructions: [
    "Pick a string (or the whole neck) and natural notes or all 12 under the fretboard.",
    "A note name appears. The neck doesn't show where it is, so find it and play it.",
    "The next note comes up once the mic has heard it. There's no timer, so take your time.",
  ],
  tips: [
    "Stuck on a note? Count up from the nearest one you know, or from the open string.",
    "Use the dots at frets 3, 5, 7, 9 and 12 as landmarks.",
    "Say the note name out loud as you play it, so the name and the spot stick together.",
  ],
  whyItMatters: "Finding a note with nothing on the neck to help is how you learn where it lives, and it's what you'll need when you play.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  customGoal: firstTarget.goal,
  customGoalDescription: "Find this note and play it",
  customGoalRegion: firstTarget.region,
  rollHuntTarget: rollTarget,
  noteHuntConfig: { rotateSeconds: 0, mode: "region", advanceOn: "solved", pickTargets: true },
};
