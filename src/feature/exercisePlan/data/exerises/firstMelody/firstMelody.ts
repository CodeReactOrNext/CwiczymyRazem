import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const firstMelodyExercise: Exercise = {
  id: "first_melody",
  isHiddenFromLibrary: true,
  title: "First Melody — One String",
  description:
    "Play a simple, expressive melody along a single string to develop horizontal movement.",
  whyItMatters: "Playing along a single string shifts your perspective from vertical shapes to horizontal intervals. This trains you to hear pitch distances clearly and develops slide and shift mechanics that make your playing sound fluid.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 2.36,
  instructions: [
    "Slide smoothly between fret positions, keeping your finger pressed lightly against the string.",
    "Use index or middle finger to lead the horizontal shifts cleanly."
  ],
  tips: [
    "Focus on the rhythmic spacing between shifts to keep the melody flowing.",
    "Add subtle vibrato to sustained notes to enhance the vocal character."
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

