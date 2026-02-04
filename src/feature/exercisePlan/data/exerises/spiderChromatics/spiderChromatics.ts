import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const spiderChromaticsExercise: Exercise = {
  id: "spider_chromatics",
  title: "Spider Chromatics - 1-2-3-4",
  description: "Classic chromatic spider exercise involving fingers 1-2-3-4 moving across all strings.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Position your fingers on consecutive frets (1-2-3-4).",
    "Play each fret sequentially on one string before moving to the next.",
    "Follow the pattern from Low E to High E and back again."
  ],
  tips: [
    "Maintain the spider hand position (one finger per fret).",
    "Keep fingers close to the fretboard when not playing.",
    "Focus on synchronous movement between both hands."
  ],
  metronomeSpeed: {
    min: 40,
    max: 200,
    recommended: 80
  },
  relatedSkills: ["finger_independence", "technique", "picking", "technique"],
  tablature: [
    {
      "timeSignature": [4, 4],
      "beats": [
        { "duration": 0.5, "notes": [{ "string": 6, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 6, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 6, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 6, "fret": 4 }] },
        { "duration": 0.5, "notes": [{ "string": 5, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 5, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 5, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 5, "fret": 4 }] },
        { "duration": 0.5, "notes": [{ "string": 4, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 4, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 4, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 4, "fret": 4 }] },
        { "duration": 0.5, "notes": [{ "string": 3, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 3, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 3, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 3, "fret": 4 }] }
      ]
    },
    {
      "timeSignature": [4, 4],
      "beats": [
        { "duration": 0.5, "notes": [{ "string": 2, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 2, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 2, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 2, "fret": 4 }] },
        { "duration": 0.5, "notes": [{ "string": 1, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 1, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 1, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 1, "fret": 4 }] },
        { "duration": 0.5, "notes": [{ "string": 2, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 2, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 2, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 2, "fret": 4 }] },
        { "duration": 0.5, "notes": [{ "string": 3, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 3, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 3, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 3, "fret": 4 }] }
      ]
    },
    {
      "timeSignature": [4, 4],
      "beats": [
        { "duration": 0.5, "notes": [{ "string": 4, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 4, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 4, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 4, "fret": 4 }] },
        { "duration": 0.5, "notes": [{ "string": 5, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 5, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 5, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 5, "fret": 4 }] },
        { "duration": 0.5, "notes": [{ "string": 6, "fret": 1 }] },
        { "duration": 0.5, "notes": [{ "string": 6, "fret": 2 }] },
        { "duration": 0.5, "notes": [{ "string": 6, "fret": 3 }] },
        { "duration": 0.5, "notes": [{ "string": 6, "fret": 4 }] }
      ]
    }
  ]
};
