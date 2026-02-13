import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const alternatePickingCrossStringExercise: Exercise = {
  id: "alternate_picking_cross_string",
  title: "Alternate Picking Cross-String",
  description: "A minor scale-based alternate picking exercise across all 6 strings. Progresses from 2-note-per-string pentatonic patterns to 3-note-per-string natural minor, training inside and outside picking.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play the tablature using strict alternate picking (down-up-down-up). Start with a downstroke.",
    "Measures 1-2 use a 2-note-per-string A minor pentatonic pattern ascending and descending across all strings.",
    "Measures 3-5 switch to 3-note-per-string A natural minor, requiring inside and outside picking string changes.",
    "Measure 6 is a short ending phrase. Repeat the whole exercise at increasing tempos.",
  ],
  tips: [
    "Keep your pick angle consistent and use small, efficient motions.",
    "Pay special attention to the string crossing moments — that's where timing breaks down.",
    "On 3-note-per-string passages, notice the difference between inside picking (pick trapped between strings) and outside picking.",
    "Start well below the recommended BPM and only speed up when every note rings cleanly.",
    "Use a metronome and accent beat 1 of each measure to stay locked in.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 140,
    recommended: 60,
  },
  relatedSkills: ["alternate_picking"],
  tablature: [
    // M1: 2nps ascending A minor pentatonic (A-C-D-E-G-A pattern across strings)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
      ],
    },
    // M2: 2nps descending A minor pentatonic
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
      ],
    },
    // M3: 3nps ascending A natural minor — strings 6-5-4 (A B C, D E F, G A B)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 5 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 5 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 9 }] },
        { duration: 0.25, notes: [{ string: 3, fret: 5 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 9 }] },
      ],
    },
    // M4: 3nps ascending — strings 2-1, then start descending
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 2, fret: 5 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 5 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 8 }] },
        { duration: 0.25, notes: [{ string: 1, fret: 8 }] }, { duration: 0.25, notes: [{ string: 1, fret: 7 }] }, { duration: 0.25, notes: [{ string: 1, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 2, fret: 8 }] }, { duration: 0.25, notes: [{ string: 2, fret: 7 }] }, { duration: 0.25, notes: [{ string: 2, fret: 5 }] },
      ],
    },
    // M5: 3nps descending — strings 3-4-5-6
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 3, fret: 9 }] }, { duration: 0.25, notes: [{ string: 3, fret: 7 }] }, { duration: 0.25, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 4, fret: 9 }] }, { duration: 0.25, notes: [{ string: 4, fret: 7 }] }, { duration: 0.25, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 8 }] }, { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 6, fret: 8 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
      ],
    },
    // M6: ending — resolve to A (2/4)
    {
      timeSignature: [2, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 5 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] }, { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
        { duration: 0.25, notes: [{ string: 5, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 8 }] }, { duration: 0.25, notes: [{ string: 6, fret: 7 }] }, { duration: 0.25, notes: [{ string: 6, fret: 5 }] },
      ],
    },
  ],
};
