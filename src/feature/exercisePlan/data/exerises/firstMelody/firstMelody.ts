import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const firstMelodyExercise: Exercise = {
  id: "first_melody",
  title: "First Melody — One String",
  description:
    "Your very first melody: 'Mary Had a Little Lamb' played entirely on the B string using only three fret positions (1, 3, 5). No string changes, no chords — just a real tune from day one.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 2.36,
  instructions: [
    "All notes are on string 2 (B string). You only need three frets: 1 (C), 3 (D), and 5 (E).",
    "Use only downstrokes for now — pick the string once per note.",
    "Play slowly: let every note ring fully before moving to the next fret.",
    "The dash (—) means silence — don't pick, just let the previous note decay.",
    "Once you can play the whole melody smoothly, add a metronome at 50 BPM.",
  ],
  tips: [
    "Press the string just behind the fret wire, not on it — that's where the clearest tone comes from.",
    "If a note buzzes, press a little harder or move your fingertip closer to the fret.",
    "Keep unused fingers hovering near the fretboard — don't let them fly away.",
    "Hum or sing the melody as you play — it connects your ear to your hands.",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 50 },
  examBacking: { url: "/static/sounds/exercise/Metronome%20Citrus.mp3", sourceBpm: 50 },
  relatedSkills: [],
  tablature: [

    // 5313
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // 555
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 335
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 5 3 1
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },

    // 5313
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // 555
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 335
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // 5 3 1
    {
      timeSignature: [4, 4],
      beats: [

        { duration: 2, notes: [{ string: 2, fret: 1 }] },
        { duration: 2, notes: [] },
      ],
    },

    // 5313
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // 555
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 335
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 5 3 1
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },

    // 5313
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // 555
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 335
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 5 3 1
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 2, notes: [{ string: 2, fret: 1 }] },
      ],
    },

    // 5313
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // 555
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 335
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 5 3 1
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 2, notes: [{ string: 2, fret: 1 }] },
      ],
    },

    // 5313
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // 555
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 335
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 5 3 1
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 2, notes: [{ string: 2, fret: 1 }] },
      ],
    },

    // 5313
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 1 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // 555
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
    // 335
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },
        { duration: 1, notes: [{ string: 2, fret: 5 }] },
        { duration: 1, notes: [{ string: 2, fret: 3 }] },

      ],
    },
    // 5 3 1
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 1 }] },
        { duration: 2, notes: [] },
      ],
    },

    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [] },
      ],
    },
    {
      timeSignature: [2, 4],
      beats: [
        { duration: 2, notes: [] },
      ],
    },

  ],
};

