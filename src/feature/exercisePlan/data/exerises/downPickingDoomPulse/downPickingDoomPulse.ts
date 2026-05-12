import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const downPickingDoomPulseExercise: Exercise = {
  id: "down_picking_doom_pulse",
  title: "Doom Pulse — Slow Down Picking Control",
  description:
    "A single-string doom groove on the low E string — all down picks, palm muted, slow and deliberate. Four measures that progressively add tension: starts with a basic E minor pentatonic move, introduces a tritone hit, stretches into half notes, and resolves back down. Inspired by Black Sabbath and early Metallica. The goal is not speed — it's a perfectly even, controlled down stroke every single time.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measure 1: E(0) → G(3) → A(5) → G(3). The core groove. Four quarter notes, palm muted. Feel the weight of each down stroke.",
    "Measure 2: E(0) → E(0) → Bb(6) → A(5). The Bb is a tritone — the devil's interval. Sounds heavy and unsettling. Hit it with full confidence.",
    "Measure 3: E(0) as a half note, then G(3) → A(5). Hold that open E for two full beats — stay locked in tempo, don't rush into the G.",
    "Measure 4: A(5) → G(3) → E(0) as a half note. Descend and land on a long, resonant open E. Let it ring with palm mute and feel the resolve.",
    "Loop: M1→M2→M3→M4→M1→... The jump from the long E in M4 back to M1 is the trickiest transition — keep the pulse steady.",
  ],
  tips: [
    "DOWN ONLY. No up strokes. Every single note is a down pick — that is the entire point of this exercise.",
    "Palm mute: rest the edge of your picking hand lightly on the strings near the bridge. Too far = completely muted. Too close = barely any muting. Find the sweet spot where you get that heavy, punchy thud.",
    "Pick angle: tilt the pick slightly so it glides through the string instead of digging in. This prevents the pick from catching.",
    "The motion comes from the wrist, not the elbow. Think of your wrist as a door hinge — small, precise downward flicks.",
    "Half notes in M3 and M4 are harder than they look. The temptation is to rush. Count out loud: '1-2-3-4' and make sure the half note lasts exactly two beats.",
    "Start at 50 BPM. When every down stroke sounds identical in tone and volume for 5 clean loops — go up by 5 BPM.",
  ],
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["hybrid_picking"],
  tablature: [
    // M1: E(0) G(3) A(5) G(3) — basic groove
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
      ],
    },
    // M2: E(0) E(0) Bb(6) A(5) — tritone hit, devil's interval
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 6, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
      ],
    },
    // M3: E(0) half note, G(3) A(5) — stretch and breathe
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
      ],
    },
    // M4: A(5) G(3) E(0) half note — descend and resolve
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        { duration: 1, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 2, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
  ],
};
