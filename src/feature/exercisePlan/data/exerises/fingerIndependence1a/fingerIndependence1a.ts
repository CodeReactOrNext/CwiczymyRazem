import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Two-string pattern (as in image):
// Variation A (cross-string): fingers 1 & 4 picked on the higher string (frets 5 & 8),
//   fingers 2 & 3 held silently on the adjacent LOWER string (frets 6 & 7).
// Variation B (same-string): all four fingers on the same higher string —
//   frets 5 & 8 picked, frets 6 & 7 ghost.
// Applied to every adjacent string pair ascending from A/E to e/B.

export const fingerIndependence1aExercise: Exercise = {
  id: "finger_independence_1a",
  title: "Finger Independence Exercise 1a",
  description: "Cross-string isolation exercise developing independence between all four fretting fingers. Outer fingers pick on the higher string while inner fingers press silently on the adjacent lower string — then all four fingers move to the same string. Works every adjacent string pair ascending from A/E to e/B.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Place fingers 1 and 4 on frets 5 and 8 of the higher string. Place fingers 2 and 3 on frets 6 and 7 of the string below — all four fingers stay pressed throughout variation A.",
    "Pick only fret 5 and fret 8. Fingers 2 and 3 are silent — do not lift them between picks.",
    "In variation B (even-numbered measures), move fingers 2 and 3 to the same string and repeat the same picking pattern.",
    "Work through all adjacent string pairs from low to high.",
  ],
  tips: [
    "The cross-string variant (variation A) is harder — the middle fingers work against a different plane of resistance.",
    "Do not let the ghost fingers fly off the string. The entire point is keeping them pressed.",
    "Keep your picking wrist loose — all the effort is in the fretting hand.",
    "Once clean, try the reverse: pick frets 6 & 7 while 5 & 8 are ghost notes.",
  ],
  metronomeSpeed: {
    min: 20,
    max: 100,
    recommended: 35,
  },
  relatedSkills: ['finger_independence'],
  tablature: [
    // === Pair 1: A(str5) picked / E(str6) ghost ===
    // M1 — variation A (cross-string): A5, A8 picked | E6, E7 ghost
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 7, isGhost: true }] },
      ],
    },
    // M2 — variation B (same-string): all on A string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, isGhost: true }] },
      ],
    },

    // === Pair 2: D(str4) picked / A(str5) ghost  ← pattern from the image ===
    // M3 — variation A (cross-string): D5, D8 picked | A6, A7 ghost
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7, isGhost: true }] },
      ],
    },
    // M4 — variation B (same-string): all on D string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, isGhost: true }] },
      ],
    },

    // === Pair 3: G(str3) picked / D(str4) ghost ===
    // M5 — variation A (cross-string): G5, G8 picked | D6, D7 ghost
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 4, fret: 7, isGhost: true }] },
      ],
    },
    // M6 — variation B (same-string): all on G string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isGhost: true }] },
      ],
    },

    // === Pair 4: B(str2) picked / G(str3) ghost ===
    // M7 — variation A (cross-string): B5, B8 picked | G6, G7 ghost
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 3, fret: 7, isGhost: true }] },
      ],
    },
    // M8 — variation B (same-string): all on B string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isGhost: true }] },
      ],
    },

    // === Pair 5: e(str1) picked / B(str2) ghost ===
    // M9 — variation A (cross-string): e5, e8 picked | B6, B7 ghost
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 2, fret: 7, isGhost: true }] },
      ],
    },
    // M10 — variation B (same-string): all on e string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 6, isGhost: true }] },
        { duration: 0.25, notes: [{ string: 1, fret: 7, isGhost: true }] },
      ],
    },
  ],
};
