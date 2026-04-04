import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const nakedToneMelodyExercise: Exercise = {
  id: "naked_tone_melody",
  title: "Naked Tone — Half Note Melody",
  description:
    "A simple 8-note melody in G major — all half notes, clean tone, zero articulation. No bends, no vibrato, no hammer-ons, no slides. Nothing. Just you, the fret, the string, and the pick. This exercise sounds trivially easy but exposes every flaw: buzzing, uneven attack, poor fretting pressure, and intonation drift. The goal is absolute perfection on every single note.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measure 1: G (string 3, fret 0) → A (string 3, fret 2). Two half notes. Each lasts exactly two beats. Let each note fully sustain — no early lift.",
    "Measure 2: B (string 3, fret 4) → D (string 2, fret 3). A string cross. Make sure the pick angle and attack stay identical on both strings.",
    "Measure 3: E (string 2, fret 5) → D (string 2, fret 3). Step back down. Listen: does the D sound exactly the same as in M2? It should.",
    "Measure 4: B (string 3, fret 4) → G (string 3, fret 0). Return to root. The open G should ring as cleanly as any fretted note.",
    "Repeat. Each loop should sound more pure, more even, more intentional than the last.",
  ],
  tips: [
    "No articulation means no articulation. Resist every instinct to add vibrato or bend to make the note sound 'better'. That is exactly the point — can you make it sound good without those tools?",
    "Fretting hand: press the string down firmly, directly behind the fret, with the very tip of your finger. Any buzzing means your finger placement is off.",
    "Picking hand: use the same pick depth, the same angle, and the same wrist speed on every single note. Inconsistency in attack is the most common issue here.",
    "Let each half note ring for its full two beats before you lift your finger. Do not mute early — that is an articulation too.",
    "Record yourself. Play it back without looking at your hands. Does every note sound identical in tone and volume? That is the standard.",
    "If a note buzzes — stop. Fix the fretting position. Do not move on until that note is clean. This is a precision exercise, not a flow exercise.",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  relatedSkills: ["articulation"],
  tablature: [
    // M1: G(str3,f0) → A(str3,f2) — open G string, step up
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 0 }] },
        { duration: 2, notes: [{ string: 3, fret: 2 }] },
      ],
    },
    // M2: B(str3,f4) → D(str2,f3) — cross to B string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 4 }] },
        { duration: 2, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // M3: E(str2,f5) → D(str2,f3) — step back down
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 2, fret: 5 }] },
        { duration: 2, notes: [{ string: 2, fret: 3 }] },
      ],
    },
    // M4: B(str3,f4) → G(str3,f0) — resolve back to root
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 2, notes: [{ string: 3, fret: 4 }] },
        { duration: 2, notes: [{ string: 3, fret: 0 }] },
      ],
    },
  ],
};
