import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const chordSpotlightDrillExercise: Exercise = {
  id: "chord_spotlight_drill",
  title: "Chord Spotlight — D Major Muting Drill",
  description: "Strike a three-string D major triad while selectively muting specific strings with your fretting hand.",
  whyItMatters: "This exercise develops independent fretting hand tension control. By holding a full chord shape and selectively releasing pressure on specific fingers, you learn to mute unwanted strings without breaking your structural hand position—an essential skill for clean rhythm playing and funky percussive strumming.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Maintain the D major chord shape throughout the entire exercise.",
    "To mute a note, release the pressure from that fretting finger while keeping it lightly touching the string.",
    "Strike all three strings simultaneously with a confident pick stroke on every beat, letting only the target note ring out.",
  ],
  tips: [
    "Do not lift your fingers completely off the strings when muting; simply relax the downward pressure to create a percussive thud.",
    "The middle measure (isolating the second string) requires the most independence—practice the pressure change slowly without picking first.",
    "Ensure your pick stroke covers all three strings equally, rather than trying to physically avoid the muted strings.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["articulation"],
  tablature: [
    // M1: Full D major — A(str3,f2) + D(str2,f3) + F#(str1,f2), all ringing
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
      ],
    },
    // M2: X(A) + X(D) + F# — only F# rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2 }] },
      ],
    },
    // M3: X(A) + D + X(F#) — only D rings (hardest)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3 }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3 }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3 }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3 }, { string: 1, fret: 2, isDead: true }] },
      ],
    },
    // M4: A + X(D) + X(F#) — only A rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2, isDead: true }] },
      ],
    },
    // M5: Full D major — resolve
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
      ],
    },
  ],
};
