import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const legatoContinuousFlowExercise: Exercise = {
  id: "legato_continuous_flow",
  title: "Continuous Legato Flow",
  description: "Maintain a continuous, unbroken stream of notes using pure legato technique.",
  whyItMatters: "Legato playing minimizes picking hand involvement to create a smooth, flowing sound. Developing continuous flow trains your fretting hand to generate consistent note volume and tone purely through finger strength and coordination.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Generate all notes purely through strong hammer-ons and clean pull-offs.",
    "Execute pull-offs with a slight downward flicking motion of the finger."
  ],
  tips: [
    "Maintain a steady rhythmic pace, matching the speed of your hammers and pulls.",
    "Mute idle strings with your picking-hand palm to keep the flow dead-silent."
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80,
  },
  relatedSkills: ["legato"],
  tablature: [
    // M1: Full ascending 3nps A natural minor at 5th pos — pick only first note per string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isHammerOn: true }] },
      ],
    },
    // M2: Continue ascending strings 2-1, then descend all 6 strings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 5, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
    // M3: Descend strings 3-6, then shift to 7th pos ascending
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 5, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 5, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 5, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 5, isPullOff: true }] },
      ],
    },
    // M4: Ascending at 7th position
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 10, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 10, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 10, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 10, isHammerOn: true }] },
      ],
    },
    // M5: Continue ascending 7th pos, turn, and begin descending back to 5th pos
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 10, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
      ],
    },
    // M6: Descend 7th position back through all strings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 10 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 10 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 10 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 7, isPullOff: true }] },
      ],
    },
  ],
};
