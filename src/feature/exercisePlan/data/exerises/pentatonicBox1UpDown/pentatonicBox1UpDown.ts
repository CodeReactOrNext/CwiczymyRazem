import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic box 1 at 5th position — up and down, all 6 strings.
// String 6 (low E): frets 5, 8
// String 5 (A):     frets 5, 7
// String 4 (D):     frets 5, 7
// String 3 (G):     frets 5, 7
// String 2 (B):     frets 5, 8
// String 1 (e):     frets 5, 8
//
// 23 notes total: 12 ascending + turnaround + 10 descending.
// Spread across 3 bars of 4/4 (last note is a quarter note).
//
// e|--------------------------------------------5--8--5-----------------------|
// B|----------------------------------5--8--5-----------8--5------------------|
// G|--------------------------5--7--5-----------------5-----7--5--------------|
// D|------------------5--7--5-------------------------5-------7--5------------|
// A|----------5--7--5-------------------------------------5-----7--5----------|
// E|--5--8--5-------------------------------------------------5-----8--5-----|

export const pentatonicBox1UpDownExercise: Exercise = {
  id: "pentatonic_box1_up_down",
  title: "Pentatonic Box 1 — Up and Down",
  description:
    "Am pentatonic box 1 at 5th position played ascending all 6 strings, then descending back. The foundation of every pentatonic solo. Slow and even — every note rings clean.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 47 / 60,
  instructions: [
    "All notes are Am pentatonic box 1 at the 5th fret. Index finger covers fret 5, pinky covers fret 7 or 8.",
    "Ascend from string 6 (low E) to string 1 (high e), then descend back to string 6.",
    "Use strict alternate picking (↓↑↓↑) throughout. Start with a downstroke.",
    "Accent every note equally — no note should be quieter than the others.",
    "Start at 60 BPM. Let each note ring fully before moving to the next.",
  ],
  tips: [
    "One finger per fret: index on fret 5, ring on fret 7, pinky on fret 8. Never use the same finger for two adjacent frets.",
    "The string crossings (especially inside crossings) are where timing breaks. Slow down if a crossing stumbles.",
    "Keep fretting fingers close to the strings — no flying fingers.",
    "The turnaround (top of string 1) is where most players rush. Treat it like any other note.",
    "This shape is movable: at fret 7 it's Bm, at fret 12 it's Em. Learn the shape, not the position.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["scales", "alternate_picking", "picking"],
  examBacking: { url: "/static/sounds/exercise/pentatonic_box_1___up_and_down_backing_track.mp3", sourceBpm: 70 },
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 1, notes: [{ string: 6, fret: 5, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 1, notes: [{ string: 6, fret: 5, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 1, notes: [{ string: 6, fret: 5, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7, isAccented: true }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 3, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 7, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 5, fret: 5, isAccented: true }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8, isAccented: true }] },
        { duration: 1, notes: [{ string: 6, fret: 5, isAccented: true }] },
      ],
    },

    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    }
  ],
};
