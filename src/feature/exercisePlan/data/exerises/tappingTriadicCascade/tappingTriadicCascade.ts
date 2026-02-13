import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const tappingTriadicCascadeExercise: Exercise = {
  id: "tapping_triadic_cascade",
  title: "Tapping Triadic Cascades",
  description: "Two-handed tapping triads on strings 1-2. Tap the high note with your picking hand, then pull-off and hammer-on with the fretting hand. Builds clean articulation and muting control.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measures 1-2: Am triad tapping pattern — tap fret 12, pull-off to 8, hammer-on to 5, repeat. Strings 1 and 2.",
    "Measures 3-4: C major triad — tap fret 12, pull-off to 8, hammer-on to 5 on string 2; tap 13, pull-off to 8, hammer-on to 5 on string 1.",
    "Measures 5-6: Move through Am → C → G → Em triads, one per beat. Practice smooth position shifts.",
    "Mute unused strings with the palm of your tapping hand resting lightly across lower strings.",
  ],
  tips: [
    "The tapped note should be a firm, quick strike directly onto the fret — like a hammer-on from above.",
    "Pull-offs from the tap should snap sideways to keep volume consistent.",
    "Mute unused strings with the palm of your right hand to avoid noise.",
    "Start very slowly — tapping clarity comes from precision, not speed.",
  ],
  metronomeSpeed: {
    min: 60,
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
