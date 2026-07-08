import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic on string 1 (high e): 3=G, 5=A, 8=C, 10=D, 12=E, 15=G
// Both the tapped note AND the pull-off target change each beat — both notes carry the melody.
// The pull-off isn't a static "home base" anymore; it's the second half of each melodic step.

export const tappingSingleStringExercise: Exercise = {
  id: "tapping_single_string",
  title: "Tapping – Simple Melody",
  description:
    "Learn basic tapping mechanics by playing a simple melody along a single string.",
  whyItMatters: "Starting with a simple melody lets you focus entirely on the physical mechanics of tapping: landing exactly in the middle of the fret and executing a clean pull-off without string noise.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Execute each tap cleanly, keeping the finger curved and landing vertically.",
    "Flick the tapped finger off the string cleanly to sound the fretted note."
  ],
  tips: [
    "Focus on achieving a consistent volume between tapped and fretted notes.",
    "Keep your fretting hand thumb anchored to stabilize the neck."
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
