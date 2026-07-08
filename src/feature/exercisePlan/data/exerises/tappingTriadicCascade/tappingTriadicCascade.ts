import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const tappingTriadicCascadeExercise: Exercise = {
  id: "tapping_triadic_cascade",
  title: "Tapping Triadic Cascades",
  description: "Execute fast, flowing tapped arpeggios that cascade diagonally.",
  whyItMatters: "Tapped arpeggios that cascade diagonally across the fretboard sound modern and complex. Combining tapping with slides and string changes creates a fluid, harp-like effect that elevates your lead guitar vocabulary.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Combine taps, slides, and string changes into a single, continuous flow.",
    "Execute diagonal slides cleanly, maintaining constant string contact."
  ],
  tips: [
    "Mute higher strings with the side of your fretting-hand index finger.",
    "Focus on rhythmic evenness—do not let the slides interrupt the flow."
  ],
  metronomeSpeed: {
    min: 40,
    max: 100,
    recommended: 80,
  },
  relatedSkills: ["tapping"],
  tablature: [
    // M1: Am triad tapping on string 1 — T12, P8, H5
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
      ],
    },
    // M2: Am continued — descending back
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
      ],
    },
    // M3: C major triad — str 2: T12-P8-H5, str 1: T13-P8-H5
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 13, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
      ],
    },
    // M4: C major continued descending
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 13, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
      ],
    },
    // M5: Triad changes — Am, C, G, Em (one triad per beat on str 1)
    {
      timeSignature: [4, 4],
      beats: [
        // Am: T12-P8-H5-H8
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        // C: T13-P8-H5-H8
        { duration: 0.25, notes: [{ string: 1, fret: 13, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        // G: T15-P8-H3-H8
        { duration: 0.25, notes: [{ string: 1, fret: 15, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 3, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8, isHammerOn: true }] },
        // Em: T12-P7-H3-H7
        { duration: 0.25, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 3, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7, isHammerOn: true }] },
      ],
    },
    // M6: Same triad changes on string 2
    {
      timeSignature: [4, 4],
      beats: [
        // Am: T12-P8-H5-H8
        { duration: 0.25, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        // C: T13-P8-H5-H8
        { duration: 0.25, notes: [{ string: 2, fret: 13, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8, isHammerOn: true }] },
        // G: T15-P7-H3-H7
        { duration: 0.25, notes: [{ string: 2, fret: 15, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 3, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isHammerOn: true }] },
        // Em: T12-P7-H3-H7
        { duration: 0.25, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isPullOff: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 3, isHammerOn: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isHammerOn: true }] },
      ],
    },
  ],
};
