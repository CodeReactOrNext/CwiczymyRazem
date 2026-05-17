import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const sweepPicking3StringExercise: Exercise = {
  id: "sweep_picking_3_string",
  title: "3-String Sweep Synchronization",
  description: "Practice clean 3-string sweep picking arpeggios to coordinate your pick stroke with sequential finger lifts.",
  whyItMatters: "This exercise coordinates the exact micro-timing between your hands required for clean sweep picking. It eliminates note bleeding by training your fretting hand to lift fingers sequentially, and teaches your picking hand to execute a single, continuous fluid sweep stroke rather than individual picking motions.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Perform 3-string triad shapes using a single, continuous sweeping motion in one direction.",
    "Synchronize the pick stroke with the exact moment each fretting finger presses the fret.",
    "Ensure notes do not ring out together — mute each note instantly as you transition to the next.",
  ],
  tips: [
    "Treat the sweep as a single fluid drop or lift of the hand, rather than a series of three separate picks.",
    "Lift each fretting finger immediately after the note sounds to prevent chord bleeding.",
    "Start at a slow tempo to ensure synchronization is completely flawless before pushing speed.",
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
