import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoControlDrillExercise: Exercise = {
  id: "vibrato_control_drill",
  title: "Vibrato Control",
  description: "Control the speed, width, and depth of your pitch modulation by sustaining notes and bent pitches across multiple strings.",
  whyItMatters: "Sustaining clean vibrato requires maintaining uniform oscillation width and speed across different fretboard locations. Practicing vibrato on regular notes, during string changes, and on bent pitches develops the finger strength and forearm rotational control needed for high-level expression and pitch consistency.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Sustain each note cleanly before starting a steady, controlled pitch modulation.",
    "Maintain consistent width and speed throughout the duration of the note.",
    "Keep the pitch modulation symmetric to ensure perfect intonation."
  ],
  tips: [
    "Rotate your wrist and forearm to drive the vibrato rather than bending your finger joints.",
    "Support the vibrating finger with adjacent fingers whenever possible for maximum control.",
    "Maintain a relaxed thumb position behind the neck to avoid hand strain."
  ],
  metronomeSpeed: {
    min: 40,
    max: 90,
    recommended: 70,
  },
  relatedSkills: ["vibrato"],
  tablature: [
    // M1: Whole notes with vibrato
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 8, isVibrato: true }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M2: Half notes with vibrato across strings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5, isVibrato: true }] },
        { duration: 1, notes: [{ string: 3, fret: 5, isVibrato: true }] },
        { duration: 1, notes: [{ string: 1, fret: 5, isVibrato: true }] },
        { duration: 1, notes: [{ string: 2, fret: 8, isVibrato: true }] },
      ],
    },
    // M3: Quarter notes with vibrato + some bends combined
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7, isVibrato: true }] },
        { duration: 1, notes: [{ string: 3, fret: 9, isVibrato: true }] },
        { duration: 1, notes: [{ string: 2, fret: 5, isBend: true, bendSemitones: 1, isVibrato: true }] },
        { duration: 1, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M4: Vibrato on bent notes — bend + hold with vibrato
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 7, isBend: true, bendSemitones: 2, isVibrato: true }] },
        { duration: 2, notes: [{ string: 3, fret: 7, isBend: true, bendSemitones: 2, isVibrato: true }] },
      ],
    },
  ],
};
