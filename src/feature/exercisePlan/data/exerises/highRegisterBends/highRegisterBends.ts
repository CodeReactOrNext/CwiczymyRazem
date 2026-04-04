import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic — same shape as position 1, two octaves higher (15th fret area):
//   B string (str 2) fret 15 → D, bend 2 semitones → E  (reference: fret 17 = E)
//   e string (str 1) fret 15 → G, bend 2 semitones → A  (reference: fret 17 = A)

export const highRegisterBendsExercise: Exercise = {
  id: "high_register_bends",
  title: "High Register Bends – 15th Fret",
  description:
    "Whole-step bends on the B and high e strings at the 15th fret — the same Am pentatonic shape as position 1, shifted two octaves up. High frets require less physical force to bend but demand better pitch control: the strings are short and tight, so overshooting is easy.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play the reference note first: fret 17 on the B string (E), then fret 17 on the e string (A).",
    "Bend from fret 15 — push upward (toward the ceiling) two semitones to match the reference.",
    "Hold the bent note for a full half note, listening carefully for pitch accuracy.",
    "Measures 1–2: B string. Measures 3–4: e string. Measures 5–8 repeat both.",
    "Use your ring finger on fret 15, middle on 14, index on 13 for full support."
  ],
  tips: [
    "High frets feel easier but pitch accuracy suffers more — even a tiny overshoot is noticeable.",
    "The string tension is lower up here, so use less wrist force than you would at the 7th fret.",
    "Keep your elbow pulled into your body slightly — it gives more wrist rotation range.",
    "On the high e string, bend toward the floor (downward) instead of toward the ceiling.",
    "Compare the bent pitch to an open string or a familiar note to double-check your ear."
  ],
  metronomeSpeed: { min: 40, max: 72, recommended: 52 },
  relatedSkills: ["bending"],
  tablature: [
    // M1-2: B string — reference then bend
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 17 }] },
        { duration: 2, notes: [{ string: 2, fret: 15, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 17 }] },
        { duration: 2, notes: [{ string: 2, fret: 15, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // M3-4: e string — reference then bend
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 17 }] },
        { duration: 2, notes: [{ string: 1, fret: 15, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 17 }] },
        { duration: 2, notes: [{ string: 1, fret: 15, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // M5-6: B string repeat
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 17 }] },
        { duration: 2, notes: [{ string: 2, fret: 15, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 17 }] },
        { duration: 2, notes: [{ string: 2, fret: 15, isBend: true, bendSemitones: 2 }] },
      ],
    },
    // M7-8: e string repeat
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 17 }] },
        { duration: 2, notes: [{ string: 1, fret: 15, isBend: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 17 }] },
        { duration: 2, notes: [{ string: 1, fret: 15, isBend: true, bendSemitones: 2 }] },
      ],
    },
  ],
};
