import type { Exercise, TablatureBeat, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

// Diagonal "X" spider across the four lowest strings (6-5-4-3), shifting up one
// fret every two beats. Each 8-note cell at base fret `b` climbs the diagonal
// (s6->s3) then descends it (s3->s6), the two passes crossing to form the X:
//   asc:  (s6,b) (s5,b+1) (s4,b+2) (s3,b+3)
//   desc: (s3,b) (s4,b+1) (s5,b+2) (s6,b+3)
const cell = (b: number): TablatureBeat[] =>
  [
    [6, b], [5, b + 1], [4, b + 2], [3, b + 3],
    [3, b], [4, b + 1], [5, b + 2], [6, b + 3],
  ].map(([string, fret]) => ({
    duration: 0.25,
    notes: [{ string, fret }],
  }));

// Two cells per measure: bars climb base fret 1->2 then 3->4.
const tablature: TablatureMeasure[] = [[1, 2], [3, 4]].map((bases) => ({
  timeSignature: [4, 4],
  beats: bases.flatMap(cell),
}));

export const spiderXExercise: Exercise = {
  id: "spider_x",
  title: "Spider X Pattern Exercise",
  description: "Play a diagonal, cross-string spider pattern that forms an 'X' shape.",
  whyItMatters: "Diagonal fretboard movement is highly common in real solos but rarely practiced. The Spider X drill breaks up linear muscle memory, training your brain and fingers to navigate the fretboard dynamically.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Sync diagonal string changes with precise alternate pick strokes.",
    "Move smoothly between positions without disrupting the rhythmic grid."
  ],
  tips: [
    "Keep your thumb positioned behind the neck to support diagonal hand movement.",
    "Mute adjacent strings with both hands to ensure maximum clarity."
  ],
  metronomeSpeed: {
    min: 40,
    max: 140,
    recommended: 80,
  },
  relatedSkills: ["finger_independence"],
  tablature,
};
