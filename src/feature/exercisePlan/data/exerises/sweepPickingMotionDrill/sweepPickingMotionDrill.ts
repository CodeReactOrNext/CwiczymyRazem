import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Each triplet 8th note = 1/3 of a beat.
// One sweep direction (3 strings) = 1 beat → full down+up cycle = 2 beats → 2 cycles per 4/4 bar.
const T = 1 / 3;

export const sweepPickingMotionDrillExercise: Exercise = {
  id: "sweep_picking_motion_drill",
  title: "Sweep Picking Motion Drill – 3 Strings",
  description:
    "Develop basic sweeping mechanics using simple three-string triad shapes.",
  whyItMatters: "Three-string sweeps are the perfect entry point to mastering the sweeping motion. Focusing on a continuous, fluid pick stroke across a small number of strings builds excellent muscle memory for larger sweeps.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Sweep the pick smoothly across three strings, avoiding separate individual pick strokes.",
    "Coordinate fretting finger rolls to ensure only one note rings at a time."
  ],
  tips: [
    "Focus on a relaxed picking wrist—let gravity pull the pick through the strings.",
    "Practice slowly to master the synchronization between both hands."
  ],
  metronomeSpeed: { min: 50, max: 130, recommended: 70 },
  relatedSkills: ["sweep_picking"],
  tablature: [
    // Measure 1 — 2 full sweep cycles (triplet 8th notes)
    {
      timeSignature: [4, 4],
      beats: [
        // Beat 1 — down sweep: G → B → e
        { duration: T, tuplet: 3, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 2, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 1, fret: 0, isDead: true }] },
        // Beat 2 — up sweep: e → B → G
        { duration: T, tuplet: 3, notes: [{ string: 1, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 2, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 3, fret: 0, isDead: true }] },
        // Beat 3 — down sweep
        { duration: T, tuplet: 3, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 2, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 1, fret: 0, isDead: true }] },
        // Beat 4 — up sweep
        { duration: T, tuplet: 3, notes: [{ string: 1, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 2, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 3, fret: 0, isDead: true }] },
      ],
    },
    // Measure 2 — identical: build muscle memory through repetition
    {
      timeSignature: [4, 4],
      beats: [
        { duration: T, tuplet: 3, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 2, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 1, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 1, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 2, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 2, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 1, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 1, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 2, fret: 0, isDead: true }] },
        { duration: T, tuplet: 3, notes: [{ string: 3, fret: 0, isDead: true }] },
      ],
    },
  ],
};
