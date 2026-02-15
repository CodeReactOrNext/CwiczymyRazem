import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const precisionBendingDrillExercise: Exercise = {
  id: "precision_bending_drill",
  title: "Precision Bend Targeting",
  description: "Half-step and whole-step bends on strings 2-3 at 5th and 7th positions. Play the target note first, then bend up to match its pitch. Progresses from single bends to bend-release sequences.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measures 1-2: Half-step bends. Play the target note (fret 8) then bend from fret 7 up a half step to match.",
    "Measures 3-4: Whole-step bends. Play target (fret 9) then bend from fret 7 up a whole step.",
    "Measures 5-6: Alternating half/whole step bends with releases — bend up, hold, then release back down.",
    "Listen carefully: the bent note should sound identical to the target note that precedes it.",
  ],
  tips: [
    "Use adjacent fingers for support when bending — stack 2-3 fingers behind the bending finger.",
    "Push the string toward the ceiling (for strings 3-6) or pull toward the floor (strings 1-2).",
    "Slow down if the bent pitch overshoots or undershoots the target.",
    "Keep your thumb anchored over the top of the neck for leverage.",
  ],
  metronomeSpeed: {
    min: 60,
    max: 100,
    recommended: 70,
  },
  relatedSkills: ["bending"],
  tablature: [
    // M1: Half-step bends on string 2 — target fret 8, bend from 7
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 8 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 8 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 8 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 8 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 1 }] },
      ],
    },
    // M2: Half-step bends at 5th position
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 6 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 6 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 6 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 6 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 1 }] },
      ],
    },
    // M3: Whole-step bends on string 2 — target fret 9, bend from 7
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 9 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 9 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 9 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 9 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // M4: Whole-step bends at 5th position
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // M5: Alternating half/whole bends with release — string 2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    // M6: Bend-release sequences across positions
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isRelease: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 1 }] },
      ],
    },
  ],
};
