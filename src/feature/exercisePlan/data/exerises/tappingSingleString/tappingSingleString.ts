import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic on string 1 (high e): 3=G, 5=A, 8=C, 10=D, 12=E, 15=G
// Both the tapped note AND the pull-off target change each beat — both notes carry the melody.
// The pull-off isn't a static "home base" anymore; it's the second half of each melodic step.

export const tappingSingleStringExercise: Exercise = {
  id: "tapping_single_string",
  title: "Tapping – Simple Melody",
  description:
    "An Am pentatonic melody on the high e string where both the tapped note and the pull-off target move independently. Every two notes form a melodic interval — a descending third, a fifth, a step. Quarter note pace so every note has room to breathe.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Left hand shifts position each beat — it is not locked in one place.",
    "Every beat is a pair: tap the upper note, pull-off to reveal the lower note.",
    "Measures 1–2: phrases descend through E→C, D→A, C→G, E→C.",
    "Measures 3–4: reach up to G(15) then step down through E, D, C.",
    "Measures 5–8 repeat — aim for even volume on both notes of every pair."
  ],
  tips: [
    "The pull-off note is not a throwaway — treat it as part of the melody, not a reset.",
    "Left-hand finger must be in position before the tap lands — pre-plant it.",
    "Sing or hum the two-note intervals as you play: your ear will guide your hands.",
    "If the pull-off note is quieter, snap the finger more decisively sideways.",
    "Play very slowly the first time through to hear the melodic shape."
  ],
  metronomeSpeed: { min: 40, max: 75, recommended: 52 },
  relatedSkills: ["tapping"],
  tablature: [
    // M1: E→C, D→A  (descending thirds/fifths)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 1, notes: [{ string: 1, fret: 10, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 5, isPullOff: true }] },
      ],
    },
    // M2: C→G, E→C
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 1, fret: 8, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 3, isPullOff: true }] },
        { duration: 1, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 8, isPullOff: true }] },
      ],
    },
    // M3: G→E, D→C  (high register, step down)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 1, fret: 15, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 1, notes: [{ string: 1, fret: 10, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 8, isPullOff: true }] },
      ],
    },
    // M4: E long, then A — phrase close
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 1, notes: [{ string: 1, fret: 5, isPullOff: true }] },
      ],
    },
    // M5-8: repeat
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 1, notes: [{ string: 1, fret: 10, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 5, isPullOff: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 1, fret: 8, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 3, isPullOff: true }] },
        { duration: 1, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 8, isPullOff: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 1, fret: 15, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 1, notes: [{ string: 1, fret: 10, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 8, isPullOff: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 1, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 1, notes: [{ string: 1, fret: 5, isPullOff: true }] },
      ],
    },
  ],
};
