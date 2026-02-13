import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoControlDrillExercise: Exercise = {
  id: "vibrato_control_drill",
  title: "Vibrato Control",
  description: "Long sustained notes with vibrato on different strings and frets. Practice slow wide vibrato and fast narrow vibrato. Builds expressive control and consistency.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measure 1: Whole notes with vibrato on string 2 fret 8 and string 3 fret 7. Let each note ring and focus on even oscillation.",
    "Measure 2: Half notes with vibrato moving across strings 2, 3, and 1.",
    "Measure 3: Quarter notes with vibrato — faster transitions require quicker vibrato onset.",
    "Measure 4: Vibrato on bent notes — bend up a whole step first, then apply vibrato while holding the bend.",
  ],
  tips: [
    "Vibrato movement should come from the wrist, not just the fingers.",
    "Start with slow, wide vibrato and gradually tighten the oscillation.",
    "Keep the vibrato rhythmic and even — avoid random wobbling.",
    "When applying vibrato to a bent note, maintain the bend pressure while oscillating.",
  ],
  metronomeSpeed: {
    min: 60,
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
