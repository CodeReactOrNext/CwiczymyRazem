import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const fretStretchDrillExercise: Exercise = {
  id: "fret_stretch_drill",
  title: "Wide Fret Span Sequences",
  description: "Develop finger flexibility and fretboard reach by practicing controlled, wide-interval fretting sequences.",
  whyItMatters: "Flexibility in the fretting hand enables you to play complex chord shapes, sweeping arpeggios, and legato lines that span multiple frets. Building proper reach mechanics—rather than just applying force—prevents hand fatigue, minimizes muscle tension, and lowers the risk of tendon strain.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Coordinate each pick stroke with precise finger placement to ensure clean articulation.",
    "Maintain a steady alternate picking pattern, keeping pick depth minimal and consistent.",
    "Practice at a slow tempo first, focusing on rhythmic precision and fluid position shifts."
  ],
  tips: [
    "Keep your fretting hand fingers hovered close to the fretboard to minimize unnecessary movement.",
    "Position your thumb behind the middle of the neck to support a curved, relaxed hand arch.",
    "Avoid excess tension in your shoulder and wrist; efficiency of movement builds speed naturally."
  ],
  metronomeSpeed: { min: 50, max: 90, recommended: 65 },
  relatedSkills: ["finger_independence"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 6 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 10 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 6 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 10 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 10 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 10 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 9 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 1 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 2 }] },
        { duration: 0.5, notes: [{ string: 5, fret: 4 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 6 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 8 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 10 }] },
      ],
    },
  ]
};
