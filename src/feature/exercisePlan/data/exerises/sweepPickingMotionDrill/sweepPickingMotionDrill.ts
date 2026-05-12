import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Each triplet 8th note = 1/3 of a beat.
// One sweep direction (3 strings) = 1 beat → full down+up cycle = 2 beats → 2 cycles per 4/4 bar.
const T = 1 / 3;

export const sweepPickingMotionDrillExercise: Exercise = {
  id: "sweep_picking_motion_drill",
  title: "Sweep Picking Motion Drill – 3 Strings",
  description:
    "Pure right-hand motion drill across G, B, and high e strings. All notes are muted — the goal is to train the sweeping wrist movement and pick-landing technique before adding fretting. Down sweep follows the natural gravity of the pick through the strings; up sweep uses a controlled return stroke.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute all three strings lightly with the palm of your fretting hand.",
    "Downstroke the G string and let the pick fall through onto the B string — don't lift between notes.",
    "Continue the same downward motion through B onto the high e string.",
    "At the high e, reverse direction: upstroke e, land on B, then upstroke B back to G.",
    "The whole six-note sweep should feel like one smooth wrist movement in each direction.",
    "Do not stop at any string — the pick should be in continuous motion throughout the cycle."
  ],
  tips: [
    "Think of the down sweep as letting gravity pull the pick through the strings, not forcing it.",
    "The turning point at the high e is where most beginners stall — keep the motion fluid.",
    "Use the minimum pick depth: just enough to catch the string, no deeper.",
    "Slow down until every hit is equal in volume — only then increase tempo.",
    "Once the motion feels natural, add fretting to turn this into real arpeggios."
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
