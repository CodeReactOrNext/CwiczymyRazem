import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const sweep5StringCascadeExercise: Exercise = {
  id: "sweep_5_string_cascade",
  title: "5-String Sweep Cascades",
  description: "Execute extended 5-string sweep arpeggios to build deep fretting hand muting control and fluid sweep motion.",
  whyItMatters: "This exercise develops muting discipline and fluid motion across almost the entire fretboard width. It trains your picking hand to execute a broad, uniform sweep stroke, and builds the string-to-string muting control required to play clean, note-separated arpeggios at any speed.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Sweep across five adjacent strings in a single, continuous pick motion.",
    "Mute each note instantly using both hands as you cross onto the next string.",
    "Perform a sharp, clean hammer-on and pull-off turnaround on the first string.",
  ],
  tips: [
    "Lightly rest your picking hand palm on the lower strings to kill trailing sympathetic resonance.",
    "Coordinate the roll of your fretting fingers to ensure only one note sounds at any given moment.",
    "Slow down the sweep if your hands lose synchronization near the turnaround notes.",
  ],
  metronomeSpeed: { min: 60, max: 120, recommended: 80 },
  relatedSkills: ["sweep_picking"],
  tablature: [
    // M1: Am 5-string sweep down and up
    {
      timeSignature: [4, 4],
      beats: [
        // Down sweep: 5→4→3→2→1, hammer at top
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
        // Up sweep: 1→2→3→4→5
        { duration: 0.25, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        // Start again
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
      ],
    },
    // M2: Am continued — second half + turnaround
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
      ],
    },
    // M3: Dm 5-string sweep (str5 f10, str4 f12, str3 f11, str2 f10, str1 f10→13)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 11 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 13, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 11 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 11 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] },
      ],
    },
    // M4: Dm continued
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 13, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 11 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 11 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 13, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 11 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
      ],
    },
    // M5: Progression — Am down, Dm down
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
        // Dm down
        { duration: 0.25, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 11 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 13, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 10, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 10 }] },
      ],
    },
    // M6: C down, Em down
    {
      timeSignature: [4, 4],
      beats: [
        // C (str5 f12, str4 f14, str3 f12, str2 f13, str1 f12→15)
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 14 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13 }] },
        // Em (str5 f12, str4 f12, str3 f12, str2 f12, str1 f12→15)
        { duration: 0.25, notes: [{ string: 5, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 15, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12 }] },
      ],
    },
  ],
};
