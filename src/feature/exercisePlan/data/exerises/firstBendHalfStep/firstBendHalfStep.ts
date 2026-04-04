import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic position 1 (fret 5 area) — half-step bends:
//   G string (str 3) fret 7 → D, bend 1 semitone → D#/Eb  (reference: fret 8)
//   B string (str 2) fret 8 → G, bend 1 semitone → G#/Ab  (reference: fret 9)

export const firstBendHalfStepExercise: Exercise = {
  id: "first_bend_half_step",
  title: "First Bend – Half Step",
  description:
    "Introduction to half-step bends across two strings in Am pentatonic position 1. A subtler, more controlled bend than a whole step — used constantly in blues and rock for that slight push of tension. Play the reference pitch first, then bend from below to match it.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play the reference note first (fret 8 on G, fret 9 on B) — that's the pitch your bend must reach.",
    "Place your ring finger on the bend fret with index and middle fingers supporting behind it.",
    "Push the string upward just enough to raise the pitch one fret — less movement than a whole step.",
    "Measures 1–2: G string (fret 7 → bend to D#). Measures 3–4: B string (fret 8 → bend to G#).",
    "Measures 5–8 repeat — use them to refine consistency and intonation.",
  ],
  tips: [
    "Half-step bends require much less wrist rotation than whole-step bends — precision matters more than force.",
    "Keep the bend controlled: overshoot by even a fraction and the pitch goes sharp.",
    "Listen hard to the reference pitch before each bend so your ear guides the movement.",
    "Support fingers behind the ring finger prevent fatigue and increase accuracy.",
    "The goal is a clean, in-tune pitch — not speed or power.",
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
