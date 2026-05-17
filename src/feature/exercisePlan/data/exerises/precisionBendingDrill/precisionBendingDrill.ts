import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const precisionBendingDrillExercise: Exercise = {
  id: "precision_bending_drill",
  title: "First Bend – Whole Step",
  description: "Develop precise whole-step bending and control. Follow the reference notes to train your ears, and master slow, controlled releases back to the starting pitch.",
  whyItMatters: "This exercise gives you total control over string tension during sustained bends and releases. You will learn to hold bent notes perfectly in tune and guide them back down smoothly without any abrupt noise.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 3,
  instructions: [
    "Listen to the target reference note before every bend to program your ear.",
    "Use your ring finger to bend, supported by your middle and index fingers behind it.",
    "Bend and release notes slowly and with full control, guiding the string back down smoothly.",
  ],
  tips: [
    "Overshooting is worse than undershooting — come up slowly and stop exactly when it matches the target.",
    "Never bend with a single finger — always support the bending finger with other fingers behind it.",
    "Do not drop the string abruptly on releases; guide it down in a fluid motion.",
  ],
  metronomeSpeed: {
    min: 50,
    max: 80,
    recommended: 60,
  },
  relatedSkills: ["bending"],
  tablature: [
    // Bar 1: reference note then bend, ×4
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // Bar 2: same — more repetition, nail the intonation
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // Bar 3: bend and release — no reference, trust your ear
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    // Bar 4: bend and release — same, longer hold implied by quarter-note durations
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 2 }] },
      ],
    },
  ],
};
