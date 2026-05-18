import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const nakedToneMelodyExercise: Exercise = {
  id: "naked_tone_melody",
  title: "Naked Tone — Half Note Melody",
  description:
    "Play slow, long melodies with zero effects to improve fundamental touch.",
  whyItMatters: "Effects like delay, reverb, and distortion can hide dynamic inconsistencies and weak fret connection. Playing with a 'naked' clean tone forces you to focus on the exact moment of finger contact, note duration, and articulation.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Connect your guitar directly to a clean amp with absolutely no reverb, delay, or gain.",
    "Let each half note ring for its exact duration, connecting them smoothly without gaps."
  ],
  tips: [
    "Listen for fret buzz, uneven volume, or weak finger pressure—fix these mechanical issues instantly.",
    "Control your pick attack to ensure every note sounds warm and balanced."
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
