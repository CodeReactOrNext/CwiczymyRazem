import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic — same shape as position 1, two octaves higher (15th fret area):
//   B string (str 2) fret 15 → D, bend 2 semitones → E  (reference: fret 17 = E)
//   e string (str 1) fret 15 → G, bend 2 semitones → A  (reference: fret 17 = A)

export const highRegisterBendsExercise: Exercise = {
  id: "high_register_bends",
  title: "High Register Bends – 15th Fret",
  description:
    "Control string tension and achieve precise intonation when bending in the higher register.",
  whyItMatters: "String tension feels significantly different in the high register compared to the middle of the neck. Practicing bends at the 15th fret and above builds the mechanical strength and fine motor skills necessary for soaring, pitch-perfect solos.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Brace your bending finger with your middle and index fingers for maximum leverage.",
    "Push the string upward, keeping your knuckles curved to prevent the string from slipping."
  ],
  tips: [
    "Be mindful of the narrow fret spacing in this register; keep your fingers tightly grouped.",
    "Ensure your picking hand mutes the lower strings to prevent high-gain feedback."
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
