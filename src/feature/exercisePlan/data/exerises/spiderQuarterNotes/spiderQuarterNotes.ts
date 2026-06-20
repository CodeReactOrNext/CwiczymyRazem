import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const spiderQuarterNotesExercise: Exercise = {
  id: "spider_quarter_notes",
  title: "Spider — One Note Per Beat",
  description:
    "The classic 1-2-3-4 spider pattern slowed right down: one struck note on every metronome click, so you can focus purely on clean finger placement.",
  whyItMatters:
    "Before you play the spider fast, your fingers need to learn exactly where to land. Playing one note per metronome click removes all time pressure — you press one finger, pick once, listen for a clean note, and move on with the next click. This builds correct hand shape and finger independence from the very first day.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 1.5,
  instructions: [
    "Use one finger per fret: index on fret 1, middle on 2, ring on 3, pinky on 4.",
    "Play one note on every metronome click — one steady pick stroke per beat.",
    "Start on the low E string and work your way up to the high E string.",
    "Keep the fingers you already placed pressed down while you add the next one.",
  ],
  tips: [
    "Press just behind the fret, not on top of it, so the note rings without buzzing.",
    "Keep your unused fingers hovering close above the strings, ready to drop.",
    "If a note buzzes or sounds muted, stop and fix your finger before the next click.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 100,
    recommended: 100,
  },
  relatedSkills: ["finger_independence"],
  tablature: [
    // Low E string (6) — fingers 1, 2, 3, 4, one note per beat
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 6, fret: 1 }] },
        { duration: 1, notes: [{ string: 6, fret: 2 }] },
        { duration: 1, notes: [{ string: 6, fret: 3 }] },
        { duration: 1, notes: [{ string: 6, fret: 4 }] },
      ],
    },
    // A string (5)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 1 }] },
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
        { duration: 1, notes: [{ string: 5, fret: 3 }] },
        { duration: 1, notes: [{ string: 5, fret: 4 }] },
      ],
    },
    // D string (4)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 4, fret: 1 }] },
        { duration: 1, notes: [{ string: 4, fret: 2 }] },
        { duration: 1, notes: [{ string: 4, fret: 3 }] },
        { duration: 1, notes: [{ string: 4, fret: 4 }] },
      ],
    },
    // G string (3)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 3 }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
      ],
    },
    // B string (2)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 4 }] },
      ],
    },
    // High E string (1)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 1, fret: 1 }] },
        { duration: 1, notes: [{ string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 1, fret: 3 }] },
        { duration: 1, notes: [{ string: 1, fret: 4 }] },
      ],
    },
  ],
};
