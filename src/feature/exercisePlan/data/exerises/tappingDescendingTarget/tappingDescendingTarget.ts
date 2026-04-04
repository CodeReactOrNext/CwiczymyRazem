import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Original concept: tap fret steps down one semitone each measure (17→12) then back up.
// Left hand is locked at fret 5. Each measure the tapping hand must land on a new fret.
// This trains right-hand pitch targeting — you can't feel your way up to the note.

const measure = (tapFret: number) => ({
  timeSignature: [4, 4] as [number, number],
  beats: [
    { duration: 0.5, notes: [{ string: 1, fret: tapFret, isTap: true }] },
    { duration: 0.5, notes: [{ string: 1, fret: 5, isPullOff: true }] },
    { duration: 0.5, notes: [{ string: 1, fret: tapFret, isTap: true }] },
    { duration: 0.5, notes: [{ string: 1, fret: 5, isPullOff: true }] },
    { duration: 0.5, notes: [{ string: 1, fret: tapFret, isTap: true }] },
    { duration: 0.5, notes: [{ string: 1, fret: 5, isPullOff: true }] },
    { duration: 0.5, notes: [{ string: 1, fret: tapFret, isTap: true }] },
    { duration: 0.5, notes: [{ string: 1, fret: 5, isPullOff: true }] },
  ],
});

export const tappingDescendingTargetExercise: Exercise = {
  id: "tapping_descending_target",
  title: "Tapping – Descending Target Drill",
  description:
    "Each measure the tapping hand drops one fret lower (from 17 down to 12), then climbs back up. The left hand stays frozen at fret 5. You cannot slide your way to the target — every tap must land accurately on a new fret from above. Trains right-hand spatial awareness and fret targeting.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Lock your left-hand index finger on fret 5, string 1 — it does not move for the whole exercise.",
    "Measures 1–6: tap fret descends from 17 to 12, one fret lower each measure.",
    "Measures 7–12: tap fret ascends from 12 back to 17.",
    "Each measure: tap → pull-off, four times in 8th notes — two beats tap, two beats pull.",
    "Say the target fret number out loud as you enter each new measure to keep yourself oriented."
  ],
  tips: [
    "Look at the fretboard when learning — there is no shame in visual targeting at first.",
    "Notice which frets feel 'long' (12-17 area) versus 'short' (5-12 area).",
    "As you descend, the tapping interval gets smaller — pay attention to pitch drift.",
    "The pull-off snap should stay consistent regardless of how far up the tap is.",
    "Challenge mode: close your eyes at slow tempo and count the frets by feel."
  ],
  metronomeSpeed: { min: 50, max: 90, recommended: 60 },
  relatedSkills: ["tapping"],
  tablature: [
    // Descending: 17 → 16 → 15 → 14 → 13 → 12
    measure(17),
    measure(16),
    measure(15),
    measure(14),
    measure(13),
    measure(12),
    // Ascending: 12 → 13 → 14 → 15 → 16 → 17
    measure(13),
    measure(14),
    measure(15),
    measure(16),
    measure(17),
    measure(17),
  ],
};
