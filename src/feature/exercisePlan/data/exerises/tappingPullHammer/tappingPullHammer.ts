import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Two strings, both moving. Half-note pairs.
// String 1 (e): tap higher, pull to varying targets → carries the upper melody voice
// String 2 (B): tap lower, pull to varying targets → carries the lower melody voice
// The two voices move in parallel thirds — a simple but immediately musical texture.

export const tappingPullHammerExercise: Exercise = {
  id: "tapping_pull_hammer",
  title: "Tapping – Two-Voice Phrase",
  description:
    "Develop counterpoint and independent phrasing by playing a two-voice tapped melody.",
  whyItMatters: "Playing independent voices with both hands builds incredible brain-to-finger coordination. This advanced technique lets you play both basslines/chords and melodies simultaneously on a single guitar.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play the bass/rhythm line with your fretting hand and the melody with your tapping hand.",
    "Maintain strict independence, ensuring both voices sound distinct and balanced."
  ],
  tips: [
    "Use a fret wrap or picking-hand palm to mute idle strings.",
    "Start slowly to coordinate the different rhythms of each hand."
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
