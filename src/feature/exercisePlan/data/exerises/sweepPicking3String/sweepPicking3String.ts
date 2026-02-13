import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const sweepPicking3StringExercise: Exercise = {
  id: "sweep_picking_3_string",
  title: "3-String Sweep Synchronization",
  description: "Clean 3-string sweep picking arpeggios focusing on right-left hand coordination. Am, C, and Dm triad shapes ascending and descending with one note per string.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Measures 1-2: Am triad arpeggio (strings 3-2-1) — sweep down then up. One continuous pick motion per direction.",
    "Measures 3-4: C major triad shape. Same sweep motion, new finger positions.",
    "Measures 5-6: Dm → Am → C progression, one arpeggio per beat. Practice smooth shape changes.",
    "The pick should flow through strings in one motion — not individual separate strokes.",
  ],
  tips: [
    "The pick flows through the strings in one smooth motion, not a series of separate hits.",
    "Lift each finger immediately after it sounds so notes don't ring into each other.",
    "Use a rolling motion in the fretting hand — each finger barres then lifts sequentially.",
    "Start extremely slow. Speed is the last thing to add with sweep picking.",
  ],
  metronomeSpeed: {
    min: 60,
    max: 100,
    recommended: 70,
  },
  relatedSkills: ["sweep_picking"],
  tablature: [
    // M1: Am triad sweep — down str 3-2-1, up str 1-2-3
    {
      timeSignature: [4, 4],
      beats: [
        // Down sweep: 3→2→1
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        // Up sweep: 1→2→3
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        // Down again
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
      ],
    },
    // M2: Am continued with variation
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
      ],
    },
    // M3: C major triad sweep (str 3 fret 9, str 2 fret 8, str 1 fret 8 → 12)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
      ],
    },
    // M4: C major continued
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
      ],
    },
    // M5: Chord progression — Dm, Am, C, Am (one arpeggio each)
    {
      timeSignature: [4, 4],
      beats: [
        // Dm: str3 f10, str2 f10, str1 f10→13
        { duration: 0.25, notes: [{ string: 3, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 13, isHammerOn: true }] },
        // Am
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        // C
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
        // Am
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isHammerOn: true }] },
      ],
    },
    // M6: Same progression descending (up sweeps)
    {
      timeSignature: [4, 4],
      beats: [
        // Dm up
        { duration: 0.25, notes: [{ string: 1, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 10 }] },
        // Am up
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        // C up
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
        // Am up
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
      ],
    },
  ],
};
