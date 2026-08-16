import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const precisionBendingDrillExercise: Exercise = {
  id: "precision_bending_drill",
  title: "Bending — Match the Reference",
  description: "Develop precise whole-step bending and control. Follow the reference notes to train your ears, and master slow, controlled releases back to the starting pitch.",
  whyItMatters: "This exercise gives you total control over string tension during sustained bends and releases. You will learn to hold bent notes perfectly in tune and guide them back down smoothly without any abrupt noise.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Play the reference note first, then take a full half note to bend up and settle on that exact pitch.",
    "Maintain steady finger pressure and hand stability at the peak of the bend.",
    "Use the rest bars to let the string ring out, judge your intonation, and relax your hand completely."
  ],
  tips: [
    "Support the bending finger with adjacent fingers on the same string for maximum strength.",
    "Rotate your wrist and forearm upward to execute the bend rather than pushing with fingers alone.",
    "If your hand starts to ache, stop and come back later — bending strength builds over weeks, not minutes."
  ],
  metronomeSpeed: {
    min: 44,
    max: 72,
    recommended: 56,
  },
  relatedSkills: ["bending"],
  tablature: [
    // Bar 1: reference note (half), then a half note to bend up and settle on it
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 9 }] },
        { duration: 2, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // Bar 2: full bar of rest — let the bend ring, judge it, unclench the hand
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    },
    // Bar 3: same reference-then-bend pair
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 9 }] },
        { duration: 2, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // Bar 4: rest
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    },
    // Bar 5: bend and slow release — no reference, trust your ear
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 2, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    // Bar 6: unbent note — checks the release actually landed back at pitch
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7 }] },
        { duration: 3, notes: [] },
      ],
    },
    // Bar 7: bend and slow release again
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 2, notes: [{ string: 2, fret: 7, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    // Bar 8: unbent note, then rest before the loop restarts
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7 }] },
        { duration: 3, notes: [] },
      ],
    },
  ],
};
