import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metalGallopExercise: Exercise = {
  id: "metal_gallop",
  title: "Iron Gallop — Thrash Rhythm Drill",
  description:
    "Master precise, high-speed rhythmic galloping patterns.",
  whyItMatters: "The gallop (one eighth note followed by two sixteenth notes) is the rhythmic heartbeat of heavy metal and hard rock. Achieving a tight, aggressive gallop requires strict pick stroke direction and palm-muting discipline.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "Maintain a strict Down-Down-Up picking pattern for each gallop sequence.",
    "Rest the side of your picking-hand palm on the strings near the bridge for a tight mute."
  ],
  tips: [
    "Focus on locking the gallop into the metronome click—avoid letting the notes rush.",
    "Keep your pick angled slightly to slice through the strings with minimal resistance."
  ],
  metronomeSpeed: { min: 80, max: 180, recommended: 120 },
  relatedSkills: ["rhythm", "articulation"],
  tablature: [
    // M1: Czyste E (fret 0) — 4 identyczne komórki gallopu, tylko str6
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
    // M2: E × 2 beaty, A (fret 5) × 1, G (fret 3) × 1
    {
      timeSignature: [4, 4],
      beats: [
        // E
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        // E
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        // A (fret 5)
        { duration: 0.25, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        // G (fret 3)
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 3, isPalmMute: true }] },
      ],
    },
  ],
};
