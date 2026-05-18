import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const mutingDisciplineDrillExercise: Exercise = {
  id: "muting_discipline_drill",
  title: "Muting Discipline Drill",
  description: "Eliminate unwanted string noise using systematic dual-hand muting.",
  whyItMatters: "Clean guitar playing, especially under high gain, requires constant control over idle strings. Mastering muting discipline ensures that only the target note is heard, resulting in professional, clear, and professional-grade performances.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Mute all strings below the active note with your picking-hand palm.",
    "Mute all strings above the active note with the underside of your fretting index finger."
  ],
  tips: [
    "Under high gain, even small finger lifts create noise; keep unused fingers touching the strings.",
    "Practice slowly to identify the exact source of any accidental string ring."
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80,
  },
  relatedSkills: ['hybrid_picking'],
  tablature: [
    // M1: String-skip between strings 6 and 4 (E minor: E-G-B pattern)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 4, fret: 0 }] },
      ],
    },
    // M2: String-skip between strings 6 and 3 (wider skip)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 3, fret: 2 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 3, fret: 0 }] },
      ],
    },
    // M3: Palm mute section — low string riff (strings 6-5)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0, isAccented: true }] }, { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 5, fret: 2, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 2 }] }, { duration: 0.5, notes: [{ string: 6, fret: 0, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 6, fret: 2 }] },
      ],
    },
    // M4: Palm mute with open string accents
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0, isAccented: true }] }, { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 0 }] }, { duration: 0.5, notes: [{ string: 5, fret: 2, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 6, fret: 3, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
      ],
    },
    // M5: Wide skip — strings 6 to 2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 2, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 2, fret: 0 }] },
      ],
    },
    // M6: Maximum skip — strings 6 to 1
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] }, { duration: 0.5, notes: [{ string: 1, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 0 }] }, { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] }, { duration: 0.5, notes: [{ string: 1, fret: 0 }] },
      ],
    },
  ],
};
