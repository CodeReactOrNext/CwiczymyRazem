import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const smoothChordTransitionsExercise: Exercise = {
  id: "smooth_chord_transitions",
  title: "Smooth Chord Transitions",
  description:
    "Exercise focused on practical voice leading by connecting chord shapes with minimal finger movement and preserving common tones between chords.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 10,
  instructions: [
    "Choose a simple looping chord progression with at least three chords (e.g. I–IV–V in any key).",
    "Decide on one fixed string set to use for all chords (e.g. strings 5–4–3 for triads or 4–3–2–1 for seventh chords).",
    "Find chord shapes on those strings only — do not switch string sets even if a chord feels uncomfortable.",
    "Change chords using the smallest possible finger movement: keep common tones held whenever possible.",
    "Move only the fingers that must change, and shift them by the shortest distance available.",
    "Play full chords (triads or seventh chords as planned) — do not omit notes to make transitions easier.",
    "Set a steady rhythm with a metronome and change chords every fixed number of beats (e.g. every 2 or 4 clicks).",
    "If a transition requires lifting all fingers or jumping positions, stop and find a closer inversion."
  ],
  tips: [
    "Analyze chord tones in advance to identify shared notes between consecutive chords.",
    "Listen for continuity — transitions should sound connected, not interrupted.",
    "Slow the tempo if needed, but do not sacrifice minimal movement for speed.",
    "Watch which fingers stay on the fretboard and which move — this awareness is key.",
    "Once comfortable, try the same progression in a different key or on another string set."
  ],
  metronomeSpeed: null,
  relatedSkills: [
    "harmony",
    "chord_theory",
    "rhythm"
  ],
};
