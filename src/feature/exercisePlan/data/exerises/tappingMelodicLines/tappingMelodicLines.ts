import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const tappingMelodicLinesExercise: Exercise = {
  id: "tapping_melodic_lines",
  title: "Melodic Tapping Compositions",
  description: "Incorporate two-handed tapping to play expressive, melodic phrases.",
  whyItMatters: "Two-handed tapping turns the guitar into a piano-like instrument. Learning to tap melodic lines rather than just fast arpeggios adds a highly lyrical, unique texture to your solos.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Tap melodic lines cleanly, balancing the volume of both hands.",
    "Sync string changes smoothly between tapped and fretted notes."
  ],
  tips: [
    "Keep your tapping hand relaxed to sustain long melodic phrases.",
    "Use a light fretting hand touch to avoid unwanted fret noise."
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 75 },
  relatedSkills: ["tapping"],
  tablature: [
    // M1: Am melodic line â€” tapped melody on str 1, bass on str 2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 10, isHammerOn: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 10 }] },
      ],
    },
    // M2: Continuing melody descending
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 10, isHammerOn: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
      ],
    },
    // M3: String jumps â€” tap melody str 1, bass notes str 3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isHammerOn: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 14, isTap: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 12, isTap: true }] },
      ],
    },
    // M4: Bass movement with tapped melody
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 15, isTap: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 10, isTap: true }] },
      ],
    },
    // M5: Full composition â€” melody across str 1-2-3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 14, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isPullOff: true }] },
      ],
    },
    // M6: Resolving phrase
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isPullOff: true }] },
        { duration: 1, notes: [{ string: 3, fret: 5 }] },
        { duration: 1, notes: [{ string: 1, fret: 12, isTap: true }] },
      ],
    },
  ],
};
