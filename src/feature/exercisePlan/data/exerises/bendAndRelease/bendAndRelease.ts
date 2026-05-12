import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic position 1:
//   G string (str 3) fret 7 → D, bend 2 → E, release back → D
//   B string (str 2) fret 8 → G, bend 2 → A, release back → G

export const bendAndReleaseExercise: Exercise = {
  id: "bend_and_release",
  title: "Bend & Release",
  description:
    "Whole-step bend followed by a slow, controlled release — on both G and B strings in Am pentatonic position 1. The release is the harder skill: the string must drift back smoothly while still ringing. Half-note values give you time to feel every stage of the movement.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Pick fret 7 (G string) or fret 8 (B string) and push up to a full whole-step bend — hold for a half note.",
    "Without re-picking, slowly lower the string back to its original position over the next half note.",
    "Play the unbent note straight for one beat to confirm you're back in tune, then rest one beat.",
    "Measures 1–2: G string bend and release. Measures 3–4: B string bend and release.",
    "Measures 5–8 repeat — focus on making the release as smooth and even as the bend."
  ],
  tips: [
    "Maintain fretting pressure throughout the release — never let go of the string.",
    "Un-rotate your wrist at the same speed you rotated it going up.",
    "The released note must ring cleanly: if it dies, you're losing contact with the fret.",
    "A wobbly or jerky release sounds like a mistake; a smooth one sounds like expression.",
    "Once the release is clean, try doing it in silence (with a pick-hand mute) to focus on feel."
  ],
  metronomeSpeed: { min: 40, max: 65, recommended: 48 },
  relatedSkills: ["bending"],
  tablature: [
    // M1: G string — bend (half note), release (half note)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    // M2: G string — straight note (quarter), rest (quarter), rest (half)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [] },
      ],
    },
    // M3: B string — bend (half), release (half)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    // M4: B string — straight, rest
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 8 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [] },
      ],
    },
    // M5-8: repeat both strings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 8 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [] },
      ],
    },
  ],
};
