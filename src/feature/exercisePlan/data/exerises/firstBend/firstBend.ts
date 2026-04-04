import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic position 1 (fret 5 area):
//   G string (str 3) fret 7 → D, bend 2 semitones → E  (reference: fret 9 = E)
//   B string (str 2) fret 8 → G, bend 2 semitones → A  (reference: fret 10 = A)

export const firstBendExercise: Exercise = {
  id: "first_bend",
  title: "First Bend – Whole Step",
  description:
    "Introduction to whole-step bends across two strings in Am pentatonic position 1. Play the target pitch first so your ear knows where to aim, then bend from the lower fret up to match it. Half-note pacing gives you time to really listen.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play the reference note first (fret 9 or 10) — that's the pitch your bend must reach.",
    "Place your ring finger on the bend fret, with middle and index fingers supporting behind it.",
    "Push the string upward until the pitch matches the reference, then hold for a full half note.",
    "Measures 1–2: G string (fret 7 → bend to E). Measures 3–4: B string (fret 8 → bend to A).",
    "Measures 5–8 repeat the same pattern — use them to refine accuracy."
  ],
  tips: [
    "Rotate your wrist to push the string — finger strength alone isn't enough.",
    "Keep your thumb anchored on the back of the neck for maximum leverage.",
    "The half-note pace is intentional: use the extra time to check the pitch before moving on.",
    "If the bent pitch drifts flat while you hold it, push slightly harder mid-note.",
    "Don't rush to the next note — a clean, sustained bend beats a fast, sloppy one."
  ],
  metronomeSpeed: { min: 40, max: 72, recommended: 52 },
  relatedSkills: ["bending"],
  tablature: [
    // M1-2: G string — reference then bend, half notes
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
    // M3-4: B string — reference then bend
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
    // M5-6: G string repeat
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
    // M7-8: B string repeat
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
  ],
};
