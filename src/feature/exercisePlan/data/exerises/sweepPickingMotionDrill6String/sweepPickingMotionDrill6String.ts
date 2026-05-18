import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Sextuplet 8th note: 6 notes fill 1 beat.
// Down sweep (6 strings) = 1 beat, up sweep = 1 beat → full cycle = 2 beats → 2 cycles per 4/4 bar.
const S = 1 / 6;

// One full down+up sweep cycle across all 6 strings (all dead/muted)
const downSweep = [
  { duration: S, tuplet: 6, notes: [{ string: 6, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 5, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 4, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 3, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 2, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 1, fret: 0, isDead: true }] },
];

const upSweep = [
  { duration: S, tuplet: 6, notes: [{ string: 1, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 2, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 3, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 4, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 5, fret: 0, isDead: true }] },
  { duration: S, tuplet: 6, notes: [{ string: 6, fret: 0, isDead: true }] },
];

export const sweepPickingMotionDrill6StringExercise: Exercise = {
  id: "sweep_picking_motion_drill_6_string",
  title: "Sweep Picking Motion Drill – 6 Strings",
  description:
    "Master full-span, six-string sweep arpeggios with intense focus on fretting rolls.",
  whyItMatters: "Six-string sweeps require exceptional coordination and palm muting. This drill teaches you to roll across multiple strings to prevent note bleeding while using your palm to keep the low strings completely quiet.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Sweep smoothly across all six strings, maintaining a constant pick velocity.",
    "Roll across adjacent strings cleanly, lifting each finger instantly after the note is struck."
  ],
  tips: [
    "Aggressively palm mute the lower strings to prevent high-gain feedback.",
    "Keep the pick angled slightly in the direction of the sweep to slice through strings."
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["sweep_picking"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [...downSweep, ...upSweep, ...downSweep, ...upSweep],
    },
    {
      timeSignature: [4, 4],
      beats: [...downSweep, ...upSweep, ...downSweep, ...upSweep],
    },
  ],
};
