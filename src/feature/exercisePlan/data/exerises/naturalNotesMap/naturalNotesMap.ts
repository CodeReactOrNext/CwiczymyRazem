import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const naturalNotesMapExercise: Exercise = {
  id: "natural_notes_map",
  title: "Natural Notes Map",
  description:
    "Exercise for fretboard mapping: systematically find and play only natural notes (A–G) across the entire guitar neck to build fast note-location awareness.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 5,
  instructions: [
    "Turn on a metronome (around 40–50 BPM) and play one note per click (quarter notes or even half notes).",
    "Allowed notes: only natural notes A, B, C, D, E, F, G — no sharps or flats.",
    "Start from the lowest natural note on the guitar (open low E) and move through the musical alphabet: E → F → G → A → B → C → D → E → ...",
    "Rule for positions: always play the next required note at the lowest possible place on the fretboard (prefer open strings and lower frets when available).",
    "Continue ascending until you reach the highest natural note available on your guitar, then reverse the sequence and descend back to the lowest E.",
    "Do not stop to think — keep the pulse even if it means going extremely slow.",
    "If you hit a wrong note, do not rewind; notice the mistake and continue from the next correct note in the sequence.",
    "Optional: try naming each note out loud while playing to reinforce mapping."
  ],
  tips: [
    "If you keep hesitating, lower the tempo until you can play without pauses.",
    "Pay extra attention to the natural-note pairs with no fret between them (B–C and E–F).",
    "Avoid memorizing 'frets only' — think in note names (G, A, B...) as you move.",
    "Try one pass without looking at the fretboard to test your internal map.",
    "Recording a short fragment can reveal where your rhythm breaks during harder areas."
  ],
  metronomeSpeed: null,
  relatedSkills: ["music_theory"],
};
