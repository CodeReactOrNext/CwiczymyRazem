import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Quarter notes drill — A string (string 5), two notes: open A (fret 0) and B (fret 2).
//
// Phase 1 (bars 1–2):  open A only — rests teach counting through silence.
// Phase 2 (bars 3–4):  fret 2 (B) only — left hand enters, pulse must hold.
// Phase 3 (bars 5–6):  A and B mixed — switching notes without rushing.
// Phase 4 (bars 7–8):  accented beat 1, final bar mostly silence.

export const quarterNotesDrillExercise: Exercise = {
  id: "quarter_notes_drill",
  title: "Quarter Notes Drill",
  description:
    "One downstroke per beat on the A string — open A and one fretted note (B), with rests scattered through the pattern. The rests are not a break; they are the exercise: count through the silence and land the next note exactly on the click.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.68,
  instructions: [
    "All notes are on string 5 (A string). Open string = A, fret 2 = B.",
    "Use only downstrokes — one per beat, no upstrokes yet.",
    "Phase 1 (bars 1–2): open A only. Count through the rests — don't speed up when silence hits.",
    "Phase 2 (bars 3–4): fret 2 (B) only. Left hand enters, but the pulse stays the same.",
    "Phase 3 (bars 5–6): A and B together. Don't rush the note that comes after a rest.",
    "Phase 4 (bars 7–8): accented beat 1 — the last bar is mostly silence, count all 4 beats.",
    "Start at 50 BPM. Tap your foot on every beat, including rests.",
  ],
  tips: [
    "Rests are not waiting — keep counting '1 2 3 4' out loud even when you're not picking.",
    "The note that comes after a rest is where most players rush — slow down mentally before that beat.",
    "Keep the pick hand moving down on every beat, even on rests — just don't touch the string.",
    "Tap your foot on the floor: foot down = beat, whether you play or not.",
  ],
  metronomeSpeed: { min: 40, max: 90, recommended: 50 },
  examBacking: { url: "/static/sounds/exercise/quarter_notes_drill_backing_track.mp3", sourceBpm: 50 },
  relatedSkills: ["rhythm", "picking"],
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
