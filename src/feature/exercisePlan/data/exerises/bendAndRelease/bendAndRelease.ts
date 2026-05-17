import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic position 1:
//   G string (str 3) fret 7 → D, bend 2 → E, release back → D
//   B string (str 2) fret 8 → G, bend 2 → A, release back → G

export const bendAndReleaseExercise: Exercise = {
  id: "bend_and_release",
  title: "Bend & Release",
  description: "Perform clean whole-step string bends followed by slow, controlled releases to develop precise pitch control and finger strength.",
  whyItMatters: "This exercise develops accurate pitch control and micro-intonation. The slow, controlled release trains your fingers to guide the string back to its starting position without losing fret pressure, eliminating pitch wobbles and ensuring a smooth, expressive vocal-like quality to your bends.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Push the string up cleanly to a full whole-step bend using three fingers (ring finger on the target fret supported by middle and index). Do not attempt to bend with a single finger.",
    "Hold the peak of the bend briefly, then slowly release the string back to its starting pitch without re-picking.",
    "Listen to ensure the string rings continuously and decays smoothly throughout the entire release.",
  ],
  tips: [
    "Use your index and middle fingers behind your bending finger to support the string tension and ensure precise pitch control.",
    "Keep steady downward fret pressure on the string during the release so the note does not choke out.",
    "Rotate your wrist from the forearm to drive the bend, rather than pushing from the finger joints.",
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
