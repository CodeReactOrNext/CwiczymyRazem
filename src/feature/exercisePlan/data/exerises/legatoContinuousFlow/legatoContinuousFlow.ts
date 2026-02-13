import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const legatoContinuousFlowExercise: Exercise = {
  id: "legato_continuous_flow",
  title: "Continuous Legato Flow",
  description: "Non-stop 3nps legato runs across the full fretboard. Pick only the first note of each string — everything else is hammer-ons and pull-offs. Builds extreme left-hand endurance and seamless string transitions.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    "Pick ONLY the first note on each new string. All other notes are pure legato (hammer-ons ascending, pull-offs descending).",
    "Measures 1-2: Full ascending and descending A natural minor run across all 6 strings at 5th position.",
    "Measures 3-4: Same run shifted to 7th position. Transition between positions without stopping.",
    "Measures 5-6: Extended run combining both positions into one continuous phrase. No breaks, no repicking.",
    "Loop the entire pattern for the full 15 minutes. This is an endurance test — stay relaxed.",
  ],
  tips: [
    "If you feel pain in your hand or forearm, STOP immediately. Soreness is OK, pain is not.",
    "Breathe steadily. Holding your breath creates tension which kills legato flow.",
    "The string transition is the hardest moment — practice crossing to the next string without any gap.",
    "Volume consistency is everything. Every note should be at the same loudness regardless of technique.",
    "On descending runs, keep your higher fingers hovering close to the frets they just left.",
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
