import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const stringSkippingArpeggiosExercise: Exercise = {
  id: "string_skipping_arpeggios",
  title: "Spread Triad Arpeggios",
  description: "Create wide intervallic sounds by playing triads across non-adjacent strings.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Play each triad with notes spread across strings 6, 3, and 1.",
    "Skip strings 5, 4, and 2 completely - your pick jumps over them.",
    "Use economy picking: down-down-down when descending strings, up-up-up when ascending.",
    "Visualize the entire chord shape before playing the arpeggio.",
    "Practice C major (6th fret), G major (3rd fret), and Am (5th fret) shapes.",
    "Keep unwanted strings muted with your fretting hand palm."
  ],
  tips: [
    "These 'spread voicings' create a piano-like sound on guitar.",
    "Visualize where your pick needs to land before you move.",
    "The wide skips require precise pick control - no wasted motion.",
    "This technique is used heavily in jazz and modern metal.",
    "Listen to Guthrie Govan or Andy Timmons for melodic examples."
  ],
  metronomeSpeed: { min: 60, max: 100, recommended: 75 },
  relatedSkills: ["string_skipping"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 4 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 4 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 10 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 12 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 10 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 12 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.5, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 3 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 4 }] },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.333, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 10 }] },
        { duration: 0.333, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.333, notes: [{ string: 5, fret: 10 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.333, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 10 }] },
        { duration: 0.333, notes: [{ string: 2, fret: 9 }] },
        { duration: 0.333, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 3, fret: 9 }] },
        { duration: 0.333, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.333, notes: [{ string: 4, fret: 10 }] },
      ],
    },
  ]
};
