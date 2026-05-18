import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const downPickingDoomPulseExercise: Exercise = {
  id: "down_picking_doom_pulse",
  title: "Doom Pulse — Slow Down Picking Control",
  description:
    "Build wrist stamina and heavy, percussive down-picking control.",
  whyItMatters: "Consistent, heavy down-picking is crucial for genres like metal, rock, and punk. This exercise trains the wrist and forearm muscles to maintain a constant dynamic attack and timing precision at solid tempos, preventing fatigue during long rhythm parts.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Execute strict down-strokes only, driving the motion entirely from your wrist.",
    "Apply constant palm muting near the bridge for a tight, chugging sound."
  ],
  tips: [
    "Keep your forearm and shoulder completely relaxed to prevent premature fatigue.",
    "Focus on uniform attack velocity to ensure every pulse sounds identical."
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
