import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const dynamicCrescendoExercise: Exercise = {
  id: "dynamic_crescendo",
  title: "Dynamic Range Control",
  description: "Master the full spectrum from whisper-quiet to aggressive attack. The volume bars below the tab show exactly how loud each note should be.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Watch the volume bars below the tablature — they show the expected loudness for each note.",
    "Measure 1: Crescendo — start as quiet as possible and gradually build to maximum volume.",
    "Measure 2: Decrescendo — start loud and smoothly fade to near-silence.",
    "Measure 3: Swell — crescendo up to full volume, then decrescendo back down.",
    "Measure 4: Subito dynamics — sudden jumps between very quiet and very loud.",
    "Measure 5: Applied to a chromatic line — maintain the crescendo shape while moving notes.",
  ],
  tips: [
    "Soft playing requires more control than loud playing — don't rush the quiet notes.",
    "Your grip pressure should stay constant — only change pick depth and attack speed.",
    "Think of a volume knob turning smoothly, not jumping between levels.",
    "For subito dynamics (measure 4), the contrast should be as extreme as possible.",
    "Record yourself and compare the volume curve to the bars — are you matching the shape?",
    "This skill separates expressive players from mechanical ones.",
  ],
  metronomeSpeed: { min: 50, max: 100, recommended: 70 },
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
