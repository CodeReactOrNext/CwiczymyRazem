import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const legatoHammerPullRunExercise: Exercise = {
  id: "legato_hammer_pull_run",
  title: "Legato Hammer-Pull Scale Run",
  description: "Incorporate legato runs across multiple strings with precise rhythmic timing.",
  whyItMatters: "Legato scale runs can sound uneven if the transition between strings is not perfectly timed. This exercise ensures that the first note on each new string is struck cleanly while the subsequent notes flow seamlessly, building high-speed coordination.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 3,
  instructions: [
    "Pick only the first note on each string, executing all other notes with legato.",
    "Coordinate string transitions quickly to prevent gaps in the rhythmic flow."
  ],
  tips: [
    "Use your fretting-hand index finger to mute the string you just exited.",
    "Keep your pick strokes minimal and synchronized with the initial notes."
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80,
  },
  relatedSkills: ["legato"],
  tablature: [
    // M1: Ascending 4-note groups â€” strings 6-5-4-3 at 5th position
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
    // M4: Position shift â€” ascending at 7th position, strings 6-5-4-3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 6, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 5, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 4, fret: 9, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 3, fret: 9, isPullOff: true }] },
      ],
    },
    // M5: Position shift â€” ascending strings 2-1, then descend
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 12, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 10, isHammerOn: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12 }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] }, { duration: 0.25, notes: [{ string: 2, fret: 10, isHammerOn: true }] },
      ],
    },
    // M6: Descending at 7th position â€” strings 3-4-5-6
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
