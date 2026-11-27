import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { NOTES } from "utils/audio/noteUtils";

import { type NoteLearnerNotes, type NoteLearnerStrings, useNoteLearnerStore } from "./noteLearnerStore";

const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];

/** One string: frets 0–11 hold every note exactly once, so each target has one
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

export const noteLearnerExercise: Exercise = {
  id: "note_learner",
  addedAt: "2026-11-27",
  isHiddenFromLanding: true,
  title: "Note Hunt — Learn Mode",
  description: "Learn where every note lives: the neck shows you the spot, you play it, the mic checks it.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 3,
  instructions: [
    "Pick a string (or the whole neck) and natural notes or all 12 under the fretboard.",
    "A note appears and every place it lives is marked on the neck. Play it.",
    "The next note comes up once the mic has heard it. There's no timer, so take your time.",
  ],
  tips: [
    "Say the note name out loud as you play it. Saying it while you see the spot is how it sticks.",
    "Before you play, look at the fret number and the dots near it, not just the marker.",
    "Once one string feels easy, switch to the Note Hunt without the markers and see what stayed.",
  ],
  whyItMatters: "You can't remember a note's place on the neck until you've found it there a few times. This mode shows you the spot first, so the repetition goes into learning it, not guessing.",
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
  disableBackingTrack: true,
  customGoal: firstTarget.goal,
  customGoalDescription: "Play the note at one of the marked spots",
  customGoalRegion: firstTarget.region,
  // No customGoalStrings: the strings come with each rolled target (the player
  // picks them in the session), and a static value here would outlive a switch
  // to the whole neck, where the target carries none.
  rollHuntTarget: rollTarget,
  noteHuntConfig: { rotateSeconds: 0, mode: "region", advanceOn: "solved", showPositions: true },
};
