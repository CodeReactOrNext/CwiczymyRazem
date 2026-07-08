import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const sweepNeoclassicalExercise: Exercise = {
  id: "sweep_neoclassical",
  title: "Neoclassical Sweep Master",
  description: "Execute multi-octave sweep arpeggios with perfect synchronization.",
  whyItMatters: "Sweeping is the ultimate high-speed arpeggio technique. This neoclassical drill focuses on the sync between the picking hand 'sweep' and fretting hand 'rolls', ensuring every note is perfectly separated and articulate.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "Drag the pick across the strings in a single, continuous, sweeping motion.",
    "Roll your fretting fingers to isolate each note and prevent chord bleeding."
  ],
  tips: [
    "Use your picking-hand palm to follow the pick, muting lower strings instantly.",
    "Coordinate the sweep speed perfectly with your fretting finger movements."
  ],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  relatedSkills: ["sweep_picking"],
  tablature: [
    // M1: Am arpeggio 12th pos — full 5-string sweep + extended turnaround
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 17, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 15, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 14, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 15, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 14, isPullOff: true }] },
      ],
    },
    // M2: Am continued — position shift to 5th pos and back
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
      ],
    },
    // M3: Bdim7 — symmetrical shape (str5 f7, str4 f9, str3 f7, str2 f9, str1 f7→10)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] },
        // Shift up 3 frets (diminished symmetry)
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 13, isHammerOn: true }] },
      ],
    },
    // M4: Bdim7 continued — sweep back and shift again
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        // Shift up another 3
        { duration: 0.25, notes: [{ string: 5, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 15 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 15 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 16, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 13, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 15 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 15 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 13 }] },
      ],
    },
    // M5: Sequence — Am sweep, Bdim7 sweep
    {
      timeSignature: [4, 4],
      beats: [
        // Am down
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        // Bdim7 down
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 9 }] },
      ],
    },
    // M6: C sweep, final Am resolution
    {
      timeSignature: [4, 4],
      beats: [
        // C down (str5 f12, str4 f14, str3 f12, str2 f13, str1 f12→15)
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        // Am final resolution (slower)
        { duration: 0.5, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
      ],
    },
  ],
};
