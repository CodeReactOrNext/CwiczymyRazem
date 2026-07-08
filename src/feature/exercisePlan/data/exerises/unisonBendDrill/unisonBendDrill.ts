import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const unisonBendDrillExercise: Exercise = {
  id: "unison_bend_drill",
  title: "Unison Bending",
  description: "Master pitch matching and microtonal adjustments in unison bends.",
  whyItMatters: "Unison bends (holding one note while bending an adjacent string to match its pitch) sound powerful and aggressive. Achieving perfect pitch unison eliminates beat frequencies, creating a massive, focused rock sound.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Hold the lower note steady while bending the adjacent string to match its pitch.",
    "Listen carefully for the microtonal 'beats' and adjust the bend until they disappear."
  ],
  tips: [
    "Support the bending finger with your other fingers for maximum control.",
    "Keep the unbent string anchored firmly so its pitch does not shift."
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  relatedSkills: ["bending"],
  tablature: [
    // M1: Str 3 fret 9 (target) + str 2 fret 7 bend whole (unison on D)
    {
      timeSignature: [4, 4],
      beats: [
        {
          duration: 2, notes: [
            { string: 3, fret: 9 },
            { string: 2, fret: 7, isBend: true, bendSemitones: 2 },
          ]
        },
        {
          duration: 2, notes: [
            { string: 3, fret: 9 },
            { string: 2, fret: 7, isBend: true, bendSemitones: 2 },
          ]
        },
      ],
    },
    // M2: Same unison, add vibrato on bent note
    {
      timeSignature: [4, 4],
      beats: [
        {
          duration: 2, notes: [
            { string: 3, fret: 9 },
            { string: 2, fret: 7, isBend: true, bendSemitones: 2, isVibrato: true },
          ]
        },
        {
          duration: 2, notes: [
            { string: 3, fret: 9 },
            { string: 2, fret: 7, isBend: true, bendSemitones: 2, isVibrato: true },
          ]
        },
      ],
    },
    // M3: Str 2 fret 10 (target A) + str 3 fret 7 bend whole (G→A)
    {
      timeSignature: [4, 4],
      beats: [
        {
          duration: 2, notes: [
            { string: 2, fret: 10 },
            { string: 3, fret: 7, isBend: true, bendSemitones: 2 },
          ]
        },
        {
          duration: 2, notes: [
            { string: 2, fret: 10 },
            { string: 3, fret: 7, isBend: true, bendSemitones: 2 },
          ]
        },
      ],
    },
    // M4: Same reverse unison with vibrato
    {
      timeSignature: [4, 4],
      beats: [
        {
          duration: 2, notes: [
            { string: 2, fret: 10 },
            { string: 3, fret: 7, isBend: true, bendSemitones: 2, isVibrato: true },
          ]
        },
        {
          duration: 2, notes: [
            { string: 2, fret: 10 },
            { string: 3, fret: 7, isBend: true, bendSemitones: 2, isVibrato: true },
          ]
        },
      ],
    },
    // M5: Moving unisons — different positions
    {
      timeSignature: [4, 4],
      beats: [
        {
          duration: 1, notes: [
            { string: 3, fret: 7 },
            { string: 2, fret: 5, isBend: true, bendSemitones: 2 },
          ]
        },
        {
          duration: 1, notes: [
            { string: 3, fret: 9 },
            { string: 2, fret: 7, isBend: true, bendSemitones: 2 },
          ]
        },
        {
          duration: 1, notes: [
            { string: 2, fret: 8 },
            { string: 3, fret: 5, isBend: true, bendSemitones: 2 },
          ]
        },
        {
          duration: 1, notes: [
            { string: 2, fret: 10 },
            { string: 3, fret: 7, isBend: true, bendSemitones: 2 },
          ]
        },
      ],
    },
    // M6: Moving unisons with vibrato on bent notes
    {
      timeSignature: [4, 4],
      beats: [
        {
          duration: 1, notes: [
            { string: 3, fret: 7 },
            { string: 2, fret: 5, isBend: true, bendSemitones: 2, isVibrato: true },
          ]
        },
        {
          duration: 1, notes: [
            { string: 3, fret: 9 },
            { string: 2, fret: 7, isBend: true, bendSemitones: 2, isVibrato: true },
          ]
        },
        {
          duration: 1, notes: [
            { string: 2, fret: 8 },
            { string: 3, fret: 5, isBend: true, bendSemitones: 2, isVibrato: true },
          ]
        },
        {
          duration: 1, notes: [
            { string: 2, fret: 10 },
            { string: 3, fret: 7, isBend: true, bendSemitones: 2, isVibrato: true },
          ]
        },
      ],
    },
  ],
};
