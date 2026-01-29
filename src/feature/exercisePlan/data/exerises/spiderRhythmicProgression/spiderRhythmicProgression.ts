import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const spiderRhythmicProgressionExercise: Exercise = {
  id: "spider_rhythmic_progression",
  title: "Spider Exercise - Rhythmic Progression",
  description: "Exercise combining spider technique with gradual change of rhythmic values, from whole notes to sixteenth notes and back.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Place your left hand fingers on four consecutive frets of one string.",
    "Start with the basic 1-2-3-4 pattern played as whole notes (one note per bar).",
    "In the next repetition, play half notes (two notes per bar).",
    "Then quarter notes (four notes per bar).",
    "Continue with eighth notes (eight notes per bar).",
    "Finish with sixteenth notes (sixteen notes per bar).",
    "Then return through the same rhythmic values back to whole notes."
  ],

  tips: [
    'How long should the hold be adjusted to your level',
    "Use a metronome to maintain steady tempo while changing rhythmic values.",
    "Each rhythmic value should be played for at least 4 bars before changing.",
    "Pay attention to rhythmic precision, especially during transitions between values.",
    "Maintain even volume and clean sound regardless of tempo.",
    "If you have difficulties, you can stay on a particular rhythmic value and practice it longer."
  ],
  metronomeSpeed: {
    min: 40,
    max: 120,
    recommended: 60
  },
  tablature: [
    { // M1: Whole notes (1 note per beat but duration 1? No, 1 note per MEASURE)
      // Actually duration 1.0 means full measure.
      timeSignature: [4, 4],
      beats: [
        { duration: 1.0, notes: [{ string: 6, fret: 1 }] },
      ]
    },
    { // M2: Whole notes continue
      timeSignature: [4, 4],
      beats: [
        { duration: 1.0, notes: [{ string: 6, fret: 2 }] },
      ]
    },
    { // M3: Half notes (2 notes per measure)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 4 }] },
      ]
    },
    { // M4: Quarter notes (4 notes per measure)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 1 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 2 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 4 }] },
      ]
    },
    { // M5: Eighth notes (8 notes per measure)
      timeSignature: [4, 4],
      beats: [
        { duration: 0.125, notes: [{ string: 4, fret: 1 }] }, { duration: 0.125, notes: [{ string: 4, fret: 2 }] },
        { duration: 0.125, notes: [{ string: 4, fret: 3 }] }, { duration: 0.125, notes: [{ string: 4, fret: 4 }] },
        { duration: 0.125, notes: [{ string: 3, fret: 1 }] }, { duration: 0.125, notes: [{ string: 3, fret: 2 }] },
        { duration: 0.125, notes: [{ string: 3, fret: 3 }] }, { duration: 0.125, notes: [{ string: 3, fret: 4 }] },
      ]
    },
    { // M6: Sixteenth notes (16 notes per measure)
      timeSignature: [4, 4],
      beats: Array.from({ length: 16 }).map((_, i) => ({
        duration: 0.0625,
        notes: [{ string: 2 - Math.floor(i / 8), fret: (i % 4) + 1 }]
      }))
    }
  ],
  relatedSkills: ["finger_independence", "technique", "rhythm", "picking"],
}; 