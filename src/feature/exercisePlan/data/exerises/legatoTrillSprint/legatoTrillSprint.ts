import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const legatoTrillSprintExercise: Exercise = {
  id: "legato_trill_sprint",
  title: "Legato Trill Sprints",
  description: "Develop muscular endurance and rapid finger coordination with trill bursts.",
  whyItMatters: "Trills require rapid, continuous hammer-ons and pull-offs between two notes. Sprints build fast-twitch muscle response in individual finger pairs, which dramatically improves overall legato speed and control.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Hammer and pull rapidly between two notes, keeping the motion highly compact.",
    "Maintain constant, high-frequency oscillation until the end of the sprint."
  ],
  tips: [
    "Keep the fingers close to the fretboard; larger finger movement slows down the trill.",
    "Incorporate wrist stability to prevent the hand from shaking during the sprint."
  ],
  metronomeSpeed: {
    min: 80,
    max: 160,
    recommended: 100,
  },
  relatedSkills: ["legato",],
  tablature: [
    // M1: Single-string sextuplet trills (5-7) â€” strings 6-5-4-3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 7, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 7, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 7, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 7, isHammerOn: true }] },
      ],
    },
    // M2: Trills (5-7) â€” strings 2-1, then descend 1-2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 7, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 7, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 1, fret: 7 }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 2, fret: 7 }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
    // M3: Wider interval trills (5-8) â€” strings 6-5-4-3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 8, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 8, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 8, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 8, isHammerOn: true }] },
      ],
    },
    // M4: Wider interval trills (5-8) â€” strings 2-1, then back
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 1, fret: 8 }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 2, fret: 8 }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
    // M5: Cross-string sextuplets â€” 3nps legato, 2 strings per beat (ascending)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 8, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 9, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 9, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 6, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 1, fret: 8 }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 7, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 1, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 8 }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 6, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
    // M6: Cross-string sextuplets descending
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.33333333333333333, notes: [{ string: 3, fret: 9 }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 7, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 9 }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 7, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5, isPullOff: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 5, fret: 8 }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 7, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 8 }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 7, isPullOff: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5, isPullOff: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 6, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 6, fret: 8, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 5, fret: 8, isHammerOn: true }] },
        { duration: 0.33333333333333333, notes: [{ string: 4, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 4, fret: 9, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 5 }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 7, isHammerOn: true }] }, { duration: 0.33333333333333333, notes: [{ string: 3, fret: 9, isHammerOn: true }] },
      ],
    },
  ],
};
