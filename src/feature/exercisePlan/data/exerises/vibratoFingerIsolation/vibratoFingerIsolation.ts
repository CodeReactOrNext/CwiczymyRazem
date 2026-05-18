import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoFingerIsolationExercise: Exercise = {
  id: "vibrato_finger_isolation",
  title: "Vibrato — One Finger at a Time",
  description:
    "Isolate and develop controlled vibrato for each individual finger.",
  whyItMatters: "Most guitarists can only vibrate with their index or middle finger. Isolating each finger builds uniform strength and wrist rotation, allowing you to add expression to any note regardless of the fingering.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Execute wavelike pitch modulation using only the active fretting finger.",
    "Rotate your wrist and forearm to drive the oscillation cleanly."
  ],
  tips: [
    "Start slowly, focusing on achieving a consistent width and speed.",
    "Keep the unused fingers relaxed and close to the fretboard."
  ],
  metronomeSpeed: { min: 40, max: 75, recommended: 55 },
  relatedSkills: ["vibrato", "finger_independence", "articulation"],
  tablature: [
    // M1: Index finger — str2, fret 5 (A#/Bb)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 5, isVibrato: true }] },
      ],
    },
    // M2: Middle finger — str2, fret 6 (B)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 6, isVibrato: true }] },
      ],
    },
    // M3: Ring finger — str2, fret 7 (C)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M4: Pinky finger — str2, fret 8 (C#)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 8, isVibrato: true }] },
      ],
    },
  ],
};
