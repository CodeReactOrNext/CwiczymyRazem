import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const precisionBendingDrillExercise: Exercise = {
  id: "precision_bending_drill",
  title: "First Bend – Whole Step",
  description:
    "Your first whole-step bend. String 2 (B), fret 7 — push up to match fret 9. Every bend is preceded by the target pitch so your ear always has a reference.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 3,
  instructions: [
    "All bends are on string 2 (B string), fret 7. The target pitch is fret 9 (same string) — play it first, then bend up to match.",
    "Bars 1–2: Pick fret 9 (reference), then bend from fret 7 up a whole step. Repeat 4 times per bar. Listen — they must sound identical.",
    "Bars 3–4: Bend and release — push up to fret 9, hold for a beat, then slowly release back to fret 7. No reference note this time, trust your ear.",
    "Use ring finger to bend, supported by middle and index behind it. Three fingers pushing together.",
    "Push the string toward the ceiling (upward) — small, controlled motion from the wrist, not just the fingers.",
  ],
  tips: [
    "Play the target note (fret 9) before every bend — your ear needs a reference. Don't skip this step.",
    "Overshooting is worse than undershooting — come up slowly and stop when it matches.",
    "Keep your thumb anchored over the top of the neck for leverage. Without it you'll run out of strength.",
    "The release must be controlled — don't just drop the string, guide it back.",
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
