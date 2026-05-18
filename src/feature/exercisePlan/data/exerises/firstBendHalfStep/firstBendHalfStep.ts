import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic position 1 (fret 5 area) — half-step bends:
//   G string (str 3) fret 7 → D, bend 1 semitone → D#/Eb  (reference: fret 8)
//   B string (str 2) fret 8 → G, bend 1 semitone → G#/Ab  (reference: fret 9)

export const firstBendHalfStepExercise: Exercise = {
  id: "first_bend_half_step",
  title: "First Bend – Half Step",
  description:
    "Master the mechanics of half-step string bending with a focus on pitch accuracy.",
  whyItMatters: "Developing accurate bending mechanics early prevents the development of weak finger-only bending habits. Precise half-step bends are critical for smooth blues and rock phrasing, helping you hit the target pitch perfectly every time.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Use your middle and index fingers to support the ring finger during the push.",
    "Push the string upward perpendicular to the neck to achieve the target half-step pitch."
  ],
  tips: [
    "Let your thumb hook slightly over the top of the neck to leverage the wrist rotation.",
    "Target a smooth, linear rise in pitch rather than a sudden, jerky movement."
  ],
  metronomeSpeed: { min: 40, max: 72, recommended: 52 },
  relatedSkills: ["bending"],
  tablature: [
    // M1-2: G string — reference then half-step bend, half notes
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 8 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 1 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 8 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 1 }] },
      ],
    },
    // M3-4: B string — reference then half-step bend
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 9 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 1 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 9 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 1 }] },
      ],
    },
    // M5-6: G string repeat
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 8 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 1 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 8 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 1 }] },
      ],
    },
    // M7-8: B string repeat
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 9 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 1 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 9 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 1 }] },
      ],
    },
  ],
};
