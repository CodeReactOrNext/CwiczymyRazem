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
    "Build basic scale navigation, alternate picking, and muscle memory.",
  whyItMatters: "Pentatonic Box 1 is the most widely used scale shape in rock, blues, and pop. Developing a highly reliable up-and-down flow through this box is the first step toward fast, fluid improvisation and soloing.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 47 / 60,
  instructions: [
    "Navigate the scale shape smoothly, maintaining a strict alternate picking pattern.",
    "Ensure both fingers and pick strike at the exact same millisecond."
  ],
  tips: [
    "Keep your fretting fingers curved and positioned close to the frets.",
    "Focus on a relaxed pick grip to prevent forearm tension as you build tempo."
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["scales", "alternate_picking"],
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
