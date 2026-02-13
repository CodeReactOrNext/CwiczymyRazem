import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const legatoTrillSprintExercise: Exercise = {
  id: "legato_trill_sprint",
  title: "Legato Trill Sprints",
  description: "Sextuplet trill patterns across strings for building legato speed and endurance. Single-string trills progressing to cross-string 3nps sextuplet runs.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Each beat is a sextuplet group (6 notes). Pick ONLY the first note of each beat, then hammer-on/pull-off the rest.",
    "Measures 1-2: Single-string trills (5-7) moving across all strings. Each beat = one string.",
    "Measures 3-4: Wider interval trills (5-8) for extra left-hand stretch.",
    "Measures 5-6: Cross-string sextuplets — 3 notes per string, 2 strings per beat. This is where real speed lives.",
  ],
  tips: [
    "Keep fingers close to the fretboard — lift only 1-2mm between notes.",
    "The pull-off is not a lift, it's a sideways snap. That's what gives it volume.",
    "Start at a tempo where every note rings clearly, then add 5 BPM at a time.",
    "If your forearm burns, take a break. Endurance builds over weeks, not minutes.",
    "Try to make the trills sound like a continuous stream, not individual pops.",
  ],
  metronomeSpeed: {
    min: 80,
    max: 160,
    recommended: 100,
  },
  relatedSkills: ["legato",],
  tablature: [
    // M1: Single-string sextuplet trills (5-7) — strings 6-5-4-3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 7, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 7, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 7, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 7, isHammerOn: true }] },
      ],
    },
    // M2: Trills (5-7) — strings 2-1, then descend 1-2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 7, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 7, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 1, fret: 7 }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 2, fret: 7 }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
    // M3: Wider interval trills (5-8) — strings 6-5-4-3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 8, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 8, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 8, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 8, isHammerOn: true }] },
      ],
    },
    // M4: Wider interval trills (5-8) — strings 2-1, then back
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 1, fret: 8 }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 2, fret: 8 }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
    // M5: Cross-string sextuplets — 3nps legato, 2 strings per beat (ascending)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 8, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 9, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 9, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 6, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 1, fret: 8 }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 7, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 8 }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 6, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
    // M6: Cross-string sextuplets descending
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.16666666666666666, notes: [{ string: 3, fret: 9 }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 7, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 9 }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 7, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5, isPullOff: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 5, fret: 8 }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 7, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 8 }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 7, isPullOff: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5, isPullOff: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 6, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 5, fret: 8, isHammerOn: true }] },
        { duration: 0.16666666666666666, notes: [{ string: 4, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 4, fret: 9, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 5 }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.16666666666666666, notes: [{ string: 3, fret: 9, isHammerOn: true }] },
      ],
    },
  ],
};
