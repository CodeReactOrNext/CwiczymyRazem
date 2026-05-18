import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Quarter notes drill — A string (string 5), two notes: open A (fret 0) and B (fret 2).
//
// Phase 1 (bars 1–2):  open A only — rests teach counting through silence.
// Phase 2 (bars 3–4):  fret 2 (B) only — left hand enters, pulse must hold.
// Phase 3 (bars 5–6):  A and B mixed — switching notes without rushing.
// Phase 4 (bars 7–8):  accented beat 1, final bar mostly silence.

export const quarterNotesDrillExercise: Exercise = {
  id: "quarter_notes_drill",
  isHiddenFromLibrary: true,
  title: "Quarter Notes Drill",
  description:
    "Develop strict timing and pick attack consistency using quarter-note pulses.",
  whyItMatters: "Perfect rhythmic timing is the separation between amateur and professional guitarists. This drill builds a solid internal clock, ensuring you land exactly on the beat without rushing or lagging behind.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.68,
  instructions: [
    "Strike exactly on the metronome click with zero rushed or lagged notes.",
    "Maintain identical pick velocity and attack angle on every beat."
  ],
  tips: [
    "Tap your foot or nod your head to internalize the pulse of the metronome.",
    "Keep your picking movement small and highly controlled to ensure timing accuracy."
  ],
  metronomeSpeed: { min: 40, max: 90, recommended: 50 },
  examBacking: { url: "/static/sounds/exercise/quarter_notes_drill_backing_track.mp3", sourceBpm: 50 },
  relatedSkills: ["rhythm"],
  tablature: [
    // Phase 1: open A
    // Bar 1: A A — —
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [] },
        { duration: 1, notes: [] },
      ],
    },
    // Bar 2: A — A A
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
      ],
    },
    // Phase 2: fret 2 (B)
    // Bar 3: B B B —
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
        { duration: 1, notes: [] },
      ],
    },
    // Bar 4: B — — B
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
        { duration: 1, notes: [] },
        { duration: 1, notes: [] },
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
      ],
    },
    // Phase 3: A and B mixed
    // Bar 5: A — B —
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [] },
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
        { duration: 1, notes: [] },
      ],
    },
    // Bar 6: A B A B
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
      ],
    },
    // Phase 4: accented beat 1, wide rests
    // Bar 7: A(acc) — B —
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [] },
        { duration: 1, notes: [{ string: 5, fret: 2 }] },
        { duration: 1, notes: [] },
      ],
    },
    // Bar 8: A — — —
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 5, fret: 0 }] },
        { duration: 1, notes: [] },
        { duration: 1, notes: [] },
        { duration: 1, notes: [] },
      ],
    },
  ],
};
