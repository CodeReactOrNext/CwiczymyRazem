import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const dynamicCrescendoExercise: Exercise = {
  id: "dynamic_crescendo",
  title: "Dynamic Range Control",
  description: "Master the full dynamic spectrum of the guitar, from whisper-quiet to an aggressive attack. Control your picking depth and attack speed to match the required volume curves.",
  whyItMatters: "This exercise trains exact physical control over pick depth and attack velocity. Differentiating volume levels smoothly (crescendo and decrescendo) separates expressive, professional guitarists from mechanical ones.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Follow the volume curves shown below the tablature exactly.",
    "Perform smooth crescendos (getting louder) and decrescendos (getting quieter).",
    "Exaggerate subito dynamics — make sudden, instant jumps between extreme loud and extreme quiet.",
  ],
  tips: [
    "Control volume by changing pick depth and wrist speed — keep your grip pressure constant.",
    "Soft playing requires much more control than loud playing; do not rush the quiet notes.",
    "Make the contrast in subito dynamics (instant jumps) as extreme and immediate as possible.",
  ],
  metronomeSpeed: { min: 50, max: 100, recommended: 70 },
  examBacking: { url: "/static/sounds/exercise/dynamic-control.mp3", sourceBpm: 70 },
  relatedSkills: ["articulation", "alternate_picking"],
  tablature: [
    // M1: Crescendo (pp → ff) — gradual volume increase
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.1 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.2 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.35 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.65 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.8 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.9 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 1.0 }] },
      ],
    },
    // M2: Decrescendo (ff → pp) — gradual volume decrease
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 1.0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.9 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.8 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.65 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.35 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.2 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.1 }] },
      ],
    },
    // M3: Swell (pp → ff → pp) — crescendo then decrescendo
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.1 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.35 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.65 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 1.0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 1.0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.65 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.35 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.1 }] },
      ],
    },
    // M4: Subito dynamics — sudden pp↔ff contrast
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.1 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.1 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 1.0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 1.0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.1 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.1 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 1.0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 1.0 }] },
      ],
    },
    // M5: Crescendo applied to chromatic line — dynamics + movement
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.15 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 6, dynamics: 0.3 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, dynamics: 0.5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 8, dynamics: 0.7 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 8, dynamics: 0.85 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, dynamics: 1.0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 6, dynamics: 0.7 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, dynamics: 0.4 }] },
      ],
    },
  ]
};
