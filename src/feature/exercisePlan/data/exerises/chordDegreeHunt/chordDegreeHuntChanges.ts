import { createChordChangesExercise } from "./createChordChangesExercise";

export const chordDegreeHuntChangesExercise = createChordChangesExercise({
  id: "chord_degree_hunt_changes",
  addedAt: "2026-09-09",
  title: "Chords — Degree Hunt (Changes)",
  description: "Land the same degree on every chord of a loop, before each change goes past.",
  difficulty: "hard",
  timeInMinutes: 5,
  progressions: [
    { name: "ii–V–I in C", chords: ["Dm7", "G7", "Cmaj7"] },
    { name: "ii–V–i in A minor", chords: ["Bm7b5", "E7", "Am7"] },
    { name: "I–vi–ii–V in C", chords: ["Cmaj7", "Am7", "Dm7", "G7"] },
    { name: "Quick-change blues in A", chords: ["A7", "D7", "A7", "E7"] },
  ],
  // Guide tones first — the two notes that carry the harmony — then the 5th as
  // an easier lap. A progression skips any degree one of its chords cannot answer.
  degrees: ["3", "7", "5"],
  barsPerChord: 2,
  metronomeSpeed: { min: 50, max: 140, recommended: 80 },
  fallbackSecondsPerChord: 6,
  instructions: [
    "Start the metronome — the chords change on the bar line, two bars each, so the loop is something you play in time with.",
    "A loop walks chord by chord; the strip under the prompt shows where you are in it.",
    "Play the asked-for degree of the chord that's up now — then the same degree of the next one, all the way round.",
    "The change comes whether or not you found it. Missing one is fine; catching the next one is the drill.",
    "After a full lap the degree changes, so the same loop comes round asking for a different note.",
    "Enable Pitch Detect so the app confirms each hit. With the click stopped the chords fall back to six seconds each.",
  ],
  tips: [
    "Look one chord ahead, not at the one you're playing — the strip shows you what's coming for exactly this reason.",
    "Find the nearest version of the next target, not the one on the same string; changes are about small moves, not big jumps.",
    "Listen for the half-step resolutions: over ii–V–I, the 7th of G7 (F) drops one fret to the 3rd of Cmaj7 (E). That semitone is the sound of the cadence.",
    "If you're consistently late, slow the click down and play the target as one long note. Being on time matters more than being busy.",
    "Say the note names of the whole lap out loud once before starting it.",
  ],
  whyItMatters:
    "Knowing that the 3rd of Dm7 is F is a fact; playing it in the bar where Dm7 actually happens is a skill, and only the second one shows up in your solos. Chasing one degree around a loop is the drill that connects the two, and it is exactly how guide-tone practice builds lines that follow the harmony instead of running a scale over the top of it.",
});
