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
  description: "Master the transitions between strings inside the pentatonic box. Focus on minimal pick travel to eliminate speed bottlenecks.",
  whyItMatters: "This exercise develops clean alternate picking across string changes. It improves your picking consistency, string transition control, and synchronization between both hands.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.37,
  instructions: [
    "Use strict alternate picking (down-up-down-up) throughout the exercise.",
    "Keep the rhythm completely even while moving between strings.",
    "Focus on clean transitions without letting other strings ring out.",
  ],
  tips: [
    "Use small, controlled pick movements — the less the pick travels, the faster you cross.",
    "Stay relaxed in both hands when crossing strings to avoid building tension.",
    "If you stumble on a crossing, slow down the tempo to build accurate muscle memory first.",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 50 },
  examBacking: { url: "/static/sounds/exercise/pentatonic_string_crossing___3_strings_backing_track.mp3", sourceBpm: 50 },
  relatedSkills: ["alternate_picking"],
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
        { duration: 2, notes: [{ string: 4, fret: 5 }] },
      ],
    },
  ],
};
