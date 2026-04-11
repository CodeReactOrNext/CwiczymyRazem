import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Am pentatonic box 1 — strings 4, 3, 2 only (middle register, 2 notes per string):
//   string 4: fret 5 (G)  fret 7 (A)
//   string 3: fret 5 (C)  fret 7 (D)
//   string 2: fret 5 (E)  fret 8 (G)
//
// Bar 1: straight ascent 4→3→2, turnaround at the top
// Bar 2: straight descent 2→3→4, land on root
// Bar 3: loop each crossing in isolation — str4↔3, then str3↔2
// Bar 4: short resolve phrase, ends on a held note

export const pentatonicStringCrossing3Exercise: Exercise = {
  id: "pentatonic_string_crossing_3",
  title: "Pentatonic String Crossing — 3 Strings",
  description:
    "Am pentatonic box 1 on strings 4, 3, and 2 only — 2 notes per string. The focus is the moment the pick crosses from one string to the next: keep the motion small, the volume even, and the timing locked.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.37,
  instructions: [
    "Use strict alternate picking throughout (↓↑↓↑). Start with a downstroke.",
    "All notes are in Am pentatonic box 1: string 4 frets 5–7, string 3 frets 5–7, string 2 frets 5–8.",
    "Bar 1: ascend from string 4 to string 2, then turn around at the top.",
    "Bar 2: descend back to string 4 and resolve on the root (fret 5, string 4).",
    "Bar 3: loop each string crossing separately — 4↔3 first, then 3↔2.",
    "Bar 4: short melodic resolve, ends on a held half-note.",
    "Start at 50 BPM. The string crossing beats are where timing breaks — slow down for those.",
  ],
  tips: [
    "When crossing to a lower string (e.g. 4→3), the next pick is an upstroke — that's an outside crossing. It feels natural.",
    "When crossing to a higher string (e.g. 3→2), the pick is trapped between strings — that's inside picking. That's the harder one.",
    "Keep the pick close to the strings between notes — the less it travels, the cleaner the crossing.",
    "If a crossing stumbles, loop just those 2 notes (last note on string X, first note on string Y) until it clicks.",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 50 },
  examBacking: { url: "/static/sounds/exercise/pentatonic_string_crossing___3_strings_backing_track.mp3", sourceBpm: 50 },
  relatedSkills: ["alternate_picking", "picking"],
  tablature: [
    // Bar 1: ascend str4 → str3 → str2, turnaround
    // ↓  ↑  ↓  ↑  ↓  ↑  ↓  ↑
    // 4/5 4/7 3/5 3/7 2/5 2/8 2/5 2/8
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
      ],
    },
    // Bar 2: descend str2 → str3 → str4, resolve on root
    // ↓  ↑  ↓  ↑  ↓  ↑  ↓  ↑
    // 2/5 3/7 3/5 4/7 4/5 4/7 4/5 3/7
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
      ],
    },
    // Bar 3: isolate crossings — str4↔3 (beats 1–2), then str3↔2 (beats 3–4)
    // 4/5 4/7 3/5 3/7 | 3/5 3/7 2/5 2/8
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
      ],
    },
    // Bar 4: short resolve — descend to root, hold
    // 2/5 3/7 3/5 4/7 | 4/5 (half note)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 3, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 2,   notes: [{ string: 4, fret: 5 }] },
      ],
    },
  ],
};
