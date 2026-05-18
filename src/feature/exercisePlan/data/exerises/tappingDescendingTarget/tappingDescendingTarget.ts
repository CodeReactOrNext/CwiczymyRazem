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
    "Practice precise, descending tapped arpeggios with clean pull-offs.",
  whyItMatters: "Descending tapping sequences can easily become muddy if the tapped finger doesn't pull off cleanly. This drill trains your tapping finger to pull slightly downward, ensuring a crisp, high-volume note trigger.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Tap the target note with high velocity, hitting exactly in the middle of the fret.",
    "Pull the tapped finger slightly downward to execute a clean, loud pull-off."
  ],
  tips: [
    "Mute the lower strings with your picking-hand palm to keep the tapped line quiet.",
    "Keep your fretting hand fingers anchored and ready for the incoming notes."
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
