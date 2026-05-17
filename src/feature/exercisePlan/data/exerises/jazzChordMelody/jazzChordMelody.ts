import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const jazzChordMelodyExercise: Exercise = {
  id: "jazz_chord_melody",
  title: "Bass and Chords",
  description: "Coordinate hybrid picking to execute clean bass lines while plucking simultaneous chord harmony.",
  whyItMatters: "This exercise develops highly independent control between your pick and fingers. By separating low-frequency bass lines from high-frequency harmony voicings, you build the essential hand coordination needed to play solo arrangements, manage polyrhythms, and achieve precise chord comping.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 15,
  instructions: [
    "Strike the low-register bass notes cleanly on the beat using your pick or fingers.",
    "Use your middle, ring, and pinky fingers to pluck the higher chord voicings on alternate beats.",
    "Coordinate the volume balance so the bass line and chords sound distinct but cohesive.",
  ],
  tips: [
    "Keep the pick steady and low to remain in position for the bass strokes.",
    "Allow your fingers to pluck upward slightly rather than clawing at the strings.",
    "Start with simple two-note voicings to master the hybrid hand coordination first.",
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
