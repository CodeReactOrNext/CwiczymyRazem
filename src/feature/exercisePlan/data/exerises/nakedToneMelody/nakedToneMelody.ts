import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const nakedToneMelodyExercise: Exercise = {
  id: "naked_tone_melody",
  title: "Clean Tone — Slow Melody",
  description:
    "Play a slow melody with a clean, plain sound to build a solid, even touch.",
  whyItMatters: "Use a plain, clean sound: an acoustic guitar as-is, or an electric on a clean setting with no added echo (reverb/delay) or distortion. A clean sound has nowhere to hide, so you can clearly hear how well each note sounds — its timing, its length, and how firmly you press the string.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play on an acoustic guitar, or on an electric with a clean sound and no added echo or distortion.",
    "Let each note ring for its full length, connecting them smoothly without gaps."
  ],
  tips: [
    "Listen for buzzing, uneven volume, or notes that don't ring clearly, and press a little firmer to fix them.",
    "Pick each string with the same steady strength so every note sounds even."
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  relatedSkills: ["articulation"],
  tablature: [
    // M1: G(str3,f0) → A(str3,f2) — open G string, step up
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 0 }] },
        { duration: 2, notes: [{ string: 3, fret: 2 }] },
      ],
    },
    // M2: B(str3,f4) → D(str2,f3) — cross to B string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 4 }] },
        { duration: 2, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // M3: E(str2,f5) → D(str2,f3) — step back down
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 5 }] },
        { duration: 2, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // M4: B(str3,f4) → G(str3,f0) — resolve back to root
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 4 }] },
        { duration: 2, notes: [{ string: 3, fret: 0 }] },
      ],
    },
  ],
};
