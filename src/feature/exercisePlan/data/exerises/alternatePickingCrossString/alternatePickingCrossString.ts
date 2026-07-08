import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const alternatePickingCrossStringExercise: Exercise = {
  id: "alternate_picking_cross_string",
  title: "Alternate Picking Cross-String",
  description: "A minor scale-based alternate picking exercise across all 6 strings. Progresses from 2-note-per-string pentatonic patterns to 3-note-per-string natural minor, training inside and outside picking.",
  whyItMatters: "This exercise develops clean alternate picking across string changes. It improves picking consistency, string transition control, and synchronization between both hands.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Use strict alternate picking throughout the exercise.",
    "Keep the rhythm even while moving between strings.",
    "Focus on clean string transitions and consistent picking motion.",
  ],
  tips: [
    "Use small and controlled pick movements.",
    "Stay relaxed when crossing strings.",
    "Keep both hands synchronized.",
    "Slow down if the picking pattern becomes uneven.",
    "Focus on accuracy before increasing speed.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 140,
    recommended: 60,
  },
  relatedSkills: ["alternate_picking"],
  tablature: [
    // M1: 2nps ascending A minor pentatonic (A-C-D-E-G-A pattern across strings)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
      ],
    },
    // M2: 2nps descending A minor pentatonic
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
      ],
    },
    // M3: 3nps ascending A natural minor — strings 6-5-4 (A B C, D E F, G A B)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
      ],
    },
    // M4: 3nps ascending — strings 2-1, then start descending
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
      ],
    },
    // M5: 3nps descending — strings 3-4-5-6
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
      ],
    },
    // M6: ending — resolve to A (2/4)
    {
      timeSignature: [2, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
      ],
    },
  ],
};
