import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Show a chord name; the player plays its tones one at a time and the app lights
// each tone (R/3/5/…) as it's found. Monophonic — works on web and native.
// Chord tones are derived from the name in the provider (see chordTones.ts).

const CHORD_POOL = ["Am", "C", "G", "D", "Em", "F", "A", "Dm", "E"];

const pickChord = (exclude?: string): string => {
  const pool = exclude ? CHORD_POOL.filter(c => c !== exclude) : CHORD_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Module-level so the goal survives re-renders and stays fixed between rotations.
let current = pickChord();

export const buildTheChordExercise: Exercise = {
  id: "build_the_chord",
  addedAt: "2026-06-25",
  isHiddenFromLanding: true,
  title: "Build the Chord",
  description: "Spell a chord by ear: play each of its tones and watch them light up one by one.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 3,
  instructions: [
    "A chord name appears (e.g. 'Am') — play its tones one at a time, not as a strum.",
    "Enable Pitch Detect so each tone (Root / 3rd / 5th) lights up as you find it.",
    "Collect all of the chord's tones; a fresh chord appears every 25 seconds.",
  ],
  tips: [
    "Start from the root, then find the 3rd and 5th — you can play them anywhere on the neck.",
    "Minor chords have a flat 3rd; major chords a natural 3rd. Listen to the colour.",
    "Let each note ring clearly so the detector locks onto a single pitch.",
    "Octave doesn't matter — any register of the tone counts.",
  ],
  whyItMatters: "Knowing the notes inside a chord — not just its shape — unlocks arpeggios, target notes for soloing, and chord substitutions. Spelling chords by ear cements the link between theory and the fretboard.",
  metronomeSpeed: { min: 40, max: 120, recommended: 60 },
  relatedSkills: ["harmony", "music_theory"],
  disableBackingTrack: true,
  customGoal: current,
  customGoalDescription: "Play each tone of this chord",
  rollHuntTarget: () => {
    current = pickChord(current);
    return { goal: current };
  },
  noteHuntConfig: { rotateSeconds: 15, mode: "chord" },
};
