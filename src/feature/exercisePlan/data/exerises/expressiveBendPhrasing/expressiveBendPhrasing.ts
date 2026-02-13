import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const expressiveBendPhrasingExercise: Exercise = {
  id: "expressive_bend_phrasing",
  title: "Expressive Bend Phrasing",
  description: "Pre-bends, release bends, bend-release-bend sequences, and compound phrases. Bluesy phrasing on Am pentatonic at 5th and 8th position.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Measures 1-2: Pre-bend + release patterns. Start at the bent pitch (PB) and release down to the fret pitch.",
    "Measures 3-4: Bend → vibrato → release sequences. Bend up, hold with vibrato, then release.",
    "Measures 5-6: Full expressive phrases combining bends, releases, vibrato, and hammer-ons in Am pentatonic.",
    "Focus on smooth transitions between techniques — the phrase should flow like a vocal line.",
  ],
  tips: [
    "For pre-bends, silently bend the string before picking so the note starts at the target pitch.",
    "When combining bend + vibrato, establish the bend first, then add vibrato.",
    "Listen to blues guitarists like B.B. King and David Gilmour for phrasing inspiration.",
    "Release bends should be controlled and gradual, not abrupt.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 100,
    recommended: 60,
  },
  relatedSkills: ["bending"],
  tablature: [
    // M1: Pre-bend + release on string 2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 8, isPreBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 8, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isPreBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isRelease: true, bendSemitones: 1 }] },
      ],
    },
    // M2: Pre-bend + release on string 3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 7, isPreBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isPreBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isRelease: true, bendSemitones: 1 }] },
      ],
    },
    // M3: Bend → vibrato → release on string 2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 8, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isRelease: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    // M4: Bend → vibrato → release on string 3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isRelease: true, bendSemitones: 1 }] },
      ],
    },
    // M5: Full expressive phrase — Am pentatonic at 8th position
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 10, isHammerOn: true }] },
        { duration: 1, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isRelease: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9, isHammerOn: true }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M6: Full expressive phrase — Am pentatonic at 5th position
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isHammerOn: true }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 2, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isRelease: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isVibrato: true }] },
      ],
    },
  ],
};
