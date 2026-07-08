import type { Exercise, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

// String-skipping spider walk: frets 1-2-3-4 on each string, played as
// sixteenth notes. The string order skips one string at a time, ascending
// over the first two bars and mirroring back down over the last two:
//   6,4,5,3 | 4,2,3,1 | 1,3,2,4 | 3,5,4,6
const STRING_ORDER: number[][] = [
  [6, 4, 5, 3],
  [4, 2, 3, 1],
  [1, 3, 2, 4],
  [3, 5, 4, 6],
];

const tablature: TablatureMeasure[] = STRING_ORDER.map((strings) => ({
  timeSignature: [4, 4],
  beats: strings.flatMap((string) =>
    [1, 2, 3, 4].map((fret) => ({
      duration: 0.25,
      notes: [{ string, fret }],
    }))
  ),
}));

export const SpiderStringSkippingExercise: Exercise = {
  id: "spider_string_skipping",
  title: "String Skipping Spider Exercise",
  description: "Integrate wide string jumps into the spider walk pattern.",
  whyItMatters: "String skipping can easily cause missed notes or accidental string noise. Combining it with the spider walk forces both hands to sync perfectly, building elite-level coordinate agility.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Coordinate large string skips with precise alternate picking strokes.",
    "Keep your picking hand movement highly controlled when crossing strings."
  ],
  tips: [
    "Use your fretting hand fingers to mute adjacent strings during wide skips.",
    "Keep your eyes focused on the target string to guide your picking hand."
  ],
  metronomeSpeed: {
    min: 40,
    max: 160,
    recommended: 80,
  },
  relatedSkills: ["string_skipping", "finger_independence"],
  tablature,
};
