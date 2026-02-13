import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const unisonBendDrillExercise: Exercise = {
  id: "unison_bend_drill",
  title: "Unison Bending",
  description: "Unison bends — play a note on one string while bending the adjacent string to match its pitch. Two-note simultaneous hits that create a dramatic unison effect. Progresses across string pairs.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Measures 1-2: String 3 fret 9 (target D) + string 2 fret 7 bend whole step (B→D unison). Play both notes simultaneously.",
    "Measures 3-4: String 2 fret 10 (target A) + string 3 fret 7 bend whole step (G→A). Reverse string pair.",
    "Measures 5-6: Moving unisons across positions with vibrato on the bent note for extra expression.",
    "The goal is to hear both notes merge into one — when the pitches match perfectly, any beating disappears.",
  ],
  tips: [
    "Use your ear — the moment the pitches match, you'll hear the beating stop and the notes fuse.",
    "The unbent note is your pitch reference. Keep it steady and adjust the bend to match.",
    "Use multiple fingers behind the bending finger for strength and control.",
    "Start without the metronome (free time) to focus on pitch accuracy, then add rhythm.",
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
