import type { Exercise, TablatureBeat, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

// Diagonal "X" spider across strings 6-4-3-1 (skipping strings 5 and 2),
// shifting up one fret every two beats. Each 8-note cell at base fret `b`
// climbs the diagonal (s6->s1) then descends it (s1->s6) with the middle
// strings' frets crossed, forming the X shape:
//   asc:  (s6,b) (s4,b+1) (s3,b+2) (s1,b+3)
//   desc: (s1,b) (s3,b+2) (s4,b+1) (s6,b+3)
const cell = (b: number): TablatureBeat[] =>
  [
    [6, b], [4, b + 1], [3, b + 2], [1, b + 3],
    [1, b], [3, b + 2], [4, b + 1], [6, b + 3],
  ].map(([string, fret]) => ({
    duration: 0.25,
    notes: [{ string, fret }],
  }));

// Two cells per measure: bars climb base fret 1->2 then 3->4.
const tablature: TablatureMeasure[] = [[1, 2], [3, 4]].map((bases) => ({
  timeSignature: [4, 4],
  beats: bases.flatMap(cell),
}));

export const spiderXExtendedExercise: Exercise = {
  id: "spider_x_extended",
  title: "Extended Spider X Exercise",
  description: "Challenge coordination with a wider, multi-position version of the diagonal Spider X.",
  whyItMatters: "The extended version introduces shifting positions along with diagonal string changes. This builds outstanding spatial awareness, finger dexterity, and high-level picking synchronization.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Execute horizontal position shifts seamlessly while maintaining diagonal picking.",
    "Keep pick strokes minimal and synchronized with fretting finger contacts."
  ],
  tips: [
    "Maintain a relaxed wrist and shoulder during wide shifts.",
    "Focus on equal note duration and volume across all strings."
  ],
  metronomeSpeed: {
    min: 40,
    max: 180,
    recommended: 90,
  },
  relatedSkills: ["finger_independence"],
  tablature,
};
