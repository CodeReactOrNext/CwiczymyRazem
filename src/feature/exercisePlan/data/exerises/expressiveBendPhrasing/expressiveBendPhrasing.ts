import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const expressiveBendPhrasingExercise: Exercise = {
  id: "expressive_bend_phrasing",
  title: "Expressive Bend Phrasing",
  description: "Integrate whole-step and half-step bends into melodic phrases with precise pitch control.",
  whyItMatters: "Bending is one of the most expressive techniques on the guitar, mimicking the human voice. Proper bending technique involves using the strength of multiple fingers and rotating the wrist to achieve perfect intonation and prevent string slippage.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Support the bending finger with your adjacent fingers to maximize control and stability.",
    "Rotate your wrist and forearm rather than pushing with fingers alone to drive the bend."
  ],
  tips: [
    "Listen closely to match the target pitch perfectlyâ€”do not under-bend or over-bend.",
    "Keep pressure constant throughout the bend so the note does not die prematurely."
  ],
  metronomeSpeed: {
    min: 40,
    max: 100,
    recommended: 60,
  },
  relatedSkills: ["bending"],
  tablature: [
    // M1: Pre-bend + release on string 2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 8, isPreBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 8, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isPreBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isRelease: true, bendSemitones: 1 }] },
      ],
    },
    // M2: Pre-bend + release on string 3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 7, isPreBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isPreBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isRelease: true, bendSemitones: 1 }] },
      ],
    },
    // M3: Bend â†’ vibrato â†’ release on string 2
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 8, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isRelease: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isRelease: true, bendSemitones: 2 }] },
      ],
    },
    // M4: Bend â†’ vibrato â†’ release on string 3
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isRelease: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 1 }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isRelease: true, bendSemitones: 1 }] },
      ],
    },
    // M5: Full expressive phrase â€” Am pentatonic at 8th position
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 10, isHammerOn: true }] },
        { duration: 1, notes: [{ string: 2, fret: 8, isBend: true, bendSemitones: 2, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isRelease: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9, isHammerOn: true }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M6: Full expressive phrase â€” Am pentatonic at 5th position
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isHammerOn: true }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isBend: true, bendSemitones: 2, isVibrato: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isRelease: true, bendSemitones: 2 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isHammerOn: true }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isVibrato: true }] },
      ],
    },
  ],
};
