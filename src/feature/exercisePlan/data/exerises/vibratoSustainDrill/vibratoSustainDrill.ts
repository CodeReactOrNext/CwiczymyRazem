import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoSustainDrillExercise: Exercise = {
  id: "vibrato_sustain_drill",
  title: "Vibrato Sustain — Hold It for the Whole Bar",
  description: "Sustain notes with continuous, even vibrato while executing precise rests to test control over pitch modulation.",
  whyItMatters: "Developing clean vibrato requires complete physical control over finger and wrist movement. By introducing intentional rests, this exercise trains you to immediately activate and deactivate the vibrato technique at precise times without resetting your hand placement or drifting in pitch and tempo.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 56 / 60,
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
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  examBacking: { url: "/static/sounds/exercise/vibrato_sustain___hold_it_for_the_whole_bar_backing_track.mp3", sourceBpm: 55 },
  relatedSkills: ["vibrato", "articulation"],
  tablature: [
    // M1: B (str2, f7) whole note vibrato — referencja
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M2: B quarter (beat 1) → rest (beat 2) → B half note vibrato (beats 3-4)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M3: D (str3, f7) whole note vibrato — nowa nuta
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M4: D quarter (beat 1) → rest (beat 2) → D half note vibrato (beats 3-4)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M5: B whole note vibrato — drugi cykl
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M6: B quarter → rest → B half vibrato
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M7: D whole note vibrato
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M8: D quarter → rest → D half vibrato
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M9: B whole note vibrato — trzeci cykl
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M10: B quarter → rest → B half vibrato
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M11: D whole note vibrato
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 3, notes: [{ string: 2, fret: 7, isVibrato: true }] },
        { duration: 1, notes: [] },
      ],
    },
    // M12: B (str2, f7) whole note vibrato — resolve
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    },
  ],
};
