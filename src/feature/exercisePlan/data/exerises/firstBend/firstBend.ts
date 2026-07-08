import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic position 1 (fret 5 area):
//   G string (str 3) fret 7 → D, bend 2 semitones → E  (reference: fret 9 = E)
//   B string (str 2) fret 8 → G, bend 2 semitones → A  (reference: fret 10 = A)

export const firstBendExercise: Exercise = {
  id: "first_bend",
  title: "First Bend – Whole Step",
  description: "Learn accurate whole-step string bending. Compare your bent pitch against reference notes to train both muscle memory and your ear.",
  whyItMatters: "This exercise teaches you to target bent pitches by ear rather than guessing. It trains your muscle memory to hit the exact whole-step pitch perfectly every time, preventing flat or out-of-tune bends.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.49,
  instructions: [
    "Play the reference note first to lock the target pitch in your ear.",
    "Use your ring finger to bend, supported by your middle and index fingers behind it for strength.",
    "Push the string upward from your wrist until the pitch matches the reference note perfectly.",
  ],
  tips: [
    "Rotate your wrist to push the string — do not rely on finger strength alone.",
    "Never bend with a single finger — always support the bending finger with other fingers behind it.",
    "Listen carefully to the sustained pitch; push slightly harder if it starts to drift flat.",
  ],
  metronomeSpeed: { min: 40, max: 72, recommended: 52 },
  relatedSkills: ["bending"],
  examBacking: { url: "/static/sounds/exercise/bends.mp3", sourceBpm: 60 },
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 9 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    }
  ],
};
