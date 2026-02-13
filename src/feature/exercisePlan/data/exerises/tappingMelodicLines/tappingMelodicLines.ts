import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const tappingMelodicLinesExercise: Exercise = {
  id: "tapping_melodic_lines",
  title: "Melodic Tapping Compositions",
  description: "Flowing melodic lines using tapping as the primary technique. Move beyond patterns into actual musical phrases across multiple strings.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    "Measures 1-2: A minor melody across strings 1-2 using tap-pulloff-hammer sequences. The melody should sing, not just sound like exercises.",
    "Measures 3-4: Wider string jumps — tapping on string 1 combined with bass notes on string 3. Think like a pianist.",
    "Measures 5-6: Full composition piece — melody moves across strings 1-2-3, combining taps, hammers, and pull-offs into a complete musical phrase.",
    "Focus on musicality: dynamics, phrasing, and making every note intentional.",
  ],
  tips: [
    "Think like a pianist — your hands work independently but create one musical statement.",
    "Let notes ring into each other where possible for a legato, flowing sound.",
    "Vary your tap attack strength to create dynamics — not every note needs the same volume.",
    "Record yourself and listen back — does it sound musical or mechanical?",
  ],
  metronomeSpeed: { min: 60, max: 100, recommended: 75 },
  relatedSkills: ["tapping"],
  tablature: [
    // M1: Am melodic line — tapped melody on str 1, bass on str 2
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
    // M3: String jumps — tap melody str 1, bass notes str 3
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
    // M5: Full composition — melody across str 1-2-3
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
