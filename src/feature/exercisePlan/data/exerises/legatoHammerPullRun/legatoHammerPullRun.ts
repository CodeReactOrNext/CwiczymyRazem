import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const legatoHammerPullRunExercise: Exercise = {
  id: "legato_hammer_pull_run",
  title: "Legato Hammer-Pull Scale Run",
  description: "4-note hammer-on / pull-off groups across A natural minor 3nps positions. Pick only the first note of each group, then hammer up and pull back. Builds left-hand strength and legato clarity.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Each group is 4 sixteenth notes: pick the first note, hammer-on to the next two, then pull-off back. Pattern per string: root → hammer → hammer → pull.",
    "Measures 1-3: Ascending then descending across all 6 strings at 5th position (A natural minor).",
    "Measures 4-6: Same pattern shifted to 7th position. Your hand has to re-settle cleanly at the new frets.",
    "Focus on making hammer-ons and pull-offs as loud as the picked note — no volume dips.",
  ],
  tips: [
    "Keep your thumb behind the neck center for maximum finger reach and pressing power.",
    "Fingers stay close to the fretboard at all times — economy of motion is key.",
    "The pull-off should snap sideways off the string, not lift straight up.",
    "If your hand tenses up, slow down. Legato is about relaxed strength, not brute force.",
    "Try playing without any distortion to honestly hear which notes are weak.",
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80,
  },
  relatedSkills: ["legato"],
  tablature: [
    // M1: Ascending 4-note groups — strings 6-5-4-3 at 5th position
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 7, isPullOff: true }] },
      ],
    },
    // M2: Ascending strings 2-1, then descend strings 1-2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 6, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 6, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 6, isHammerOn: true }] },
      ],
    },
    // M3: Descending strings 3-4-5-6
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 7, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 7, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 7, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 7, isHammerOn: true }] },
      ],
    },
    // M4: Position shift — ascending at 7th position, strings 6-5-4-3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isPullOff: true }] },
      ],
    },
    // M5: Position shift — ascending strings 2-1, then descend
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 12, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isHammerOn: true }] },
      ],
    },
    // M6: Descending at 7th position — strings 3-4-5-6
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 10 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 10 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 10 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isHammerOn: true }] },
      ],
    },
  ],
};
