import type { Exercise, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

// Petrucci-style 4-fret stretch (frets 10-13, one finger per fret) run through
// four finger permutations, then walked down a string each measure.
// Each permutation is applied positionally to a 4-string window.
const PERMUTATIONS: number[][] = [
  [10, 11, 12, 13],
  [10, 12, 11, 13],
  [13, 12, 11, 10],
  [13, 11, 12, 10],
];

// Per measure the window of four strings, ordered low (thick) -> high (thin):
//   measure 1: strings 4-3-2-1, measure 2: 5-4-3-2, measure 3: 6-5-4-3
const tablature: TablatureMeasure[] = [0, 1, 2].map((shift) => {
  const strings = [4 + shift, 3 + shift, 2 + shift, 1 + shift];
  return {
    timeSignature: [4, 4],
    beats: PERMUTATIONS.flatMap((frets) =>
      frets.map((fret, i) => ({
        duration: 0.25,
        notes: [{ string: strings[i], fret }],
      }))
    ),
  };
});

export const jpStretching: Exercise = {
  id: "jp_stretching",
  title: "Petrucci Stretching Exercise",
  description: "Expand your finger reach and hand flexibility with a wide-interval linear stretch.",
  whyItMatters: "Developing wide fretboard reach requires careful conditioning of the hand muscles. This exercise helps build structural reach, making complex jazz chords and wide-span metal/shred runs feel effortless and comfortable.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Position your thumb low behind the middle of the neck to maximize finger span.",
    "Execute each note cleanly, ensuring all fingers remain curved and relaxed."
  ],
  tips: [
    "Stop immediately if you feel sharp pain—stretch slowly and build reach over time.",
    "Keep your shoulder and elbow relaxed to allow your hand to rotate naturally."
  ],
  metronomeSpeed: null,
  relatedSkills: ["finger_independence"],
  tablature
};
