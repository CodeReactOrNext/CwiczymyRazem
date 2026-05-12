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
    "Full six-string sweep motion drill. All notes are muted — the entire focus is on training the pick to flow continuously from the low E string to the high e and back in one uninterrupted stroke. The wider range exposes weaknesses in the turn-around and in maintaining even volume across all strings.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute all six strings lightly with the palm of your fretting hand.",
    "Begin with a downstroke on the low E string — let the pick fall through into the A string immediately.",
    "Continue the same downward motion through D, G, B, and high e without lifting the pick.",
    "At the high e string, reverse direction with an upstroke and flow back through B, G, D, A to low E.",
    "The entire twelve-note cycle should be two smooth wrist motions — one down, one up.",
    "Keep volume even across all strings; the middle strings (D and G) are the easiest to rush."
  ],
  tips: [
    "The two turn-around points (at high e and low E) are where the motion stalls — prioritise smoothness there.",
    "Use minimal pick depth on every string: just enough to sound it, no deeper.",
    "Watch for unwanted string noise — the fretting hand mute must cover all six strings evenly.",
    "If any string is significantly louder or quieter, stop and fix it before increasing tempo.",
    "Once this feels effortless, move on to the 3-string arpeggio version and work up from there."
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
