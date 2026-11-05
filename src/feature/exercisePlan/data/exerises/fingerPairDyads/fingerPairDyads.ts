import type { Exercise, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

// One finger per fret in 5th position (index 5, middle 6, ring 7, pinky 8).
// Each bar is one pair of adjacent strings: fingers 1+3 land together, then
// swap to 2+4, twice. The pairs climb from E+A to B+e and walk back down, so
// the loop returns to E+A.
const STEP_A = [
  { offset: 0, fret: 5, finger: 1 },
  { offset: 1, fret: 7, finger: 3 },
] as const;
const STEP_B = [
  { offset: 0, fret: 6, finger: 2 },
  { offset: 1, fret: 8, finger: 4 },
] as const;

/** Lower (thicker) string of each pair, 6 = low E. */
const PAIR_ORDER = [6, 5, 4, 3, 2, 3, 4, 5];

const pairMeasure = (lowerString: number): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: [STEP_A, STEP_B, STEP_A, STEP_B].map((step) => ({
    duration: 1,
    notes: step.map(({ offset, fret, finger }) => ({
      string: lowerString - offset,
      fret,
      finger,
    })),
  })),
});

export const fingerPairDyadsExercise: Exercise = {
  id: "finger_pair_dyads",
  title: "Finger Pair Dyads",
  description:
    "Land two fingers at exactly the same moment on adjacent strings, then swap them for the other two — the core motion behind every clean chord change.",
  whyItMatters:
    "A chord change is several fingers landing as one shape. Most players place them one after another, which costs time and makes the first strum of the new chord ragged. Training pairs of fingers to land together, and to swap with the next pair in one motion, builds that shape-at-once habit without having to think about chord grips yet.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 3,
  instructions: [
    "Keep one finger per fret: index on fret 5, middle on 6, ring on 7, pinky on 8. The small number beside each note shows the finger.",
    "Play both notes of each pair together, one pair per metronome click.",
    "Swap pairs in one motion: fingers 1 and 3 lift the moment 2 and 4 land.",
    "Climb from the E and A strings up to B and high e, then walk back down.",
  ],
  tips: [
    "Lift fingers only a millimetre or two off the strings between pairs.",
    "If one note starts before the other, slow down — the point is landing together.",
    "Press only as hard as needed to stop the buzz, with your thumb behind the neck near your middle finger.",
    "When a whole pass is clean, raise the tempo by 5 BPM.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 60,
  },
  relatedSkills: ["finger_independence"],
  tablature: PAIR_ORDER.map(pairMeasure),
};
