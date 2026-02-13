import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const fretStretchDrillExercise: Exercise = {
  id: "fret_stretch_drill",
  title: "Wide Fret Span Sequences",
  description: "Gradually expand your fret reach with controlled stretching patterns.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Start with patterns spanning 5 frets: index on fret 1, pinky on fret 6.",
    "Play sequences that require stretching between index and middle, and ring and pinky.",
    "Keep your thumb behind the neck - never let it creep over the top during stretches.",
    "Practice the pattern 1-2-4-5 (index, middle, ring skip a fret, pinky).",
    "Move to higher positions where frets are narrower as you build strength.",
    "Stop immediately if you feel sharp pain - stretching takes time to develop."
  ],
  tips: [
    "ALWAYS warm up before attempting stretch exercises - cold muscles tear easily.",
    "Never force a stretch - build flexibility gradually over weeks and months.",
    "Start in higher positions (around fret 7-12) where frets are closer together.",
    "As you get comfortable, move toward the nut where frets are wider.",
    "Steve Vai's '10-hour workout' includes extensive stretch training.",
    "Allan Holdsworth could span 6+ frets with ease from years of practice.",
    "Think 'reach' not 'stretch' - use proper hand positioning, not just force."
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
