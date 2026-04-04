import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Two strings, both moving. Half-note pairs.
// String 1 (e): tap higher, pull to varying targets → carries the upper melody voice
// String 2 (B): tap lower, pull to varying targets → carries the lower melody voice
// The two voices move in parallel thirds — a simple but immediately musical texture.

export const tappingPullHammerExercise: Exercise = {
  id: "tapping_pull_hammer",
  title: "Tapping – Two-Voice Phrase",
  description:
    "A two-string tapping phrase where both voices move independently — no note stays the same twice in a row. String 1 carries the upper melody, string 2 echoes a third below. Both the tap note and the pull-off target vary each half bar, so the hands are always doing something different.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Each half bar: tap a note on one string, then pull off to a different fret on the same string.",
    "Measures 1–4: the two strings take turns — listen for the alternating voice effect.",
    "Measures 5–8: both strings play in the same half bar — tap str1 then immediately str2.",
    "Neither the tap fret nor the pull-off target repeat consecutively — follow the notation.",
    "Half notes only: one tap + one pull-off per half bar. Do not rush."
  ],
  tips: [
    "Pre-plant the pull-off finger before the tap — it must already be on the string.",
    "When alternating strings (M5–8), mute the idle string with your right-hand palm.",
    "Listen for the interval each pair makes — third, fourth, fifth — name it as you play.",
    "The lower string (B) pull-offs sound darker and warmer — let that colour show.",
    "If one voice is louder than the other, adjust tap pressure until they balance."
  ],
  metronomeSpeed: { min: 40, max: 65, recommended: 48 },
  relatedSkills: ["tapping"],
  tablature: [
    // M1: str1 E→C then D→A
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 12, isTap: true }] },
        { duration: 2, notes: [{ string: 1, fret: 8, isPullOff: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 10, isTap: true }] },
        { duration: 2, notes: [{ string: 1, fret: 5, isPullOff: true }] },
      ],
    },
    // M3: str2 B→G then A→E  (B string: fret 12=B, fret 8=G, fret 10=A, fret 5=E)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 12, isTap: true }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isPullOff: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 10, isTap: true }] },
        { duration: 2, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
    // M5: both strings — tap str1(15→12) then str2(12→8)  (high G → E, then B → G)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 15, isTap: true }] },
        { duration: 2, notes: [{ string: 2, fret: 12, isTap: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 12, isPullOff: true }] },
        { duration: 2, notes: [{ string: 2, fret: 8, isPullOff: true }] },
      ],
    },
    // M7: str1(10→8) then str2(10→5)  (D→C, A→E)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 10, isTap: true }] },
        { duration: 2, notes: [{ string: 2, fret: 10, isTap: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 1, fret: 8, isPullOff: true }] },
        { duration: 2, notes: [{ string: 2, fret: 5, isPullOff: true }] },
      ],
    },
  ],
};
