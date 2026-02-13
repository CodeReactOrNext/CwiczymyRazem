import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const jazzChordMelodyExercise: Exercise = {
  id: "jazz_chord_melody",
  title: "Bass and Chords",
  description: "Play bass notes with pick while comping chords with fingers.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    "Use the pick to play bass notes on beats 1 and 3.",
    "Use fingers (i, m, a) to pluck chord voicings on beats 2 and 4.",
    "Create a walking bass line with the pick while comping chords above.",
    "Practice simple II-V-I progression first (Dm7-G7-Cmaj7).",
    "Focus on smooth voice leading between chord voicings.",
    "Keep bass notes steady while adding chord punctuations."
  ],
  tips: [
    "Think of your picking hand as two separate instruments - bass and piano.",
    "The pick plays the role of a bass player - steady and grounded.",
    "Fingers add harmonic color like piano comping in a jazz trio.",
    "Listen to Joe Pass, Wes Montgomery, or Ted Greene for examples.",
    "Start with simple two-note voicings before attempting full chords."
  ],
  metronomeSpeed: { min: 70, max: 110, recommended: 90 },
  relatedSkills: ["hybrid_picking"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 5 }] },
        { duration: 1, notes: [{ string: 3, fret: 5 }, { string: 2, fret: 6 }, { string: 1, fret: 5 }] },
        { duration: 1, notes: [{ string: 5, fret: 3 }] },
        { duration: 1, notes: [{ string: 3, fret: 5 }, { string: 2, fret: 6 }, { string: 1, fret: 5 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 6, fret: 3 }] },
        { duration: 1, notes: [{ string: 4, fret: 3 }, { string: 3, fret: 4 }, { string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 6, fret: 5 }] },
        { duration: 1, notes: [{ string: 4, fret: 3 }, { string: 3, fret: 4 }, { string: 2, fret: 3 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 3 }] },
        { duration: 1, notes: [{ string: 4, fret: 2 }, { string: 3, fret: 4 }, { string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 6, fret: 3 }] },
        { duration: 1, notes: [{ string: 4, fret: 2 }, { string: 3, fret: 4 }, { string: 2, fret: 5 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        { duration: 1, notes: [{ string: 3, fret: 5 }, { string: 2, fret: 6 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 1, notes: [{ string: 4, fret: 3 }, { string: 3, fret: 4 }] },
      ],
    },
  ]
};
