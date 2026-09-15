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
  title: "Pentatonic — String Crossing",
  description: "Master the transitions between strings inside the pentatonic box. Focus on minimal pick travel to eliminate speed bottlenecks.",
  whyItMatters: "This exercise develops clean alternate picking across string changes. It improves your picking consistency, string transition control, and synchronization between both hands.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1.37,
  instructions: [
    "Stay in A minor pentatonic box 1 on strings 4, 3 and 2 — index finger on fret 5, ring or pinky on fret 7 (fret 8 on string 2).",
    "Pick strictly alternate: down on every first note of a string, up on every second, so each crossing arrives on the pick stroke the tab expects.",
    "Bar 3 loops the two crossings on their own — repeat it until strings 4\u21943 and 3\u21942 feel identical before playing the whole pattern again."
  ],
  tips: [
    "Keep the pick close to the strings through a crossing; most speed is lost to travel, not to the fingers.",
    "If a run hiccups, it is almost always a crossing \u2014 slow down until both crossings are even, then raise the tempo.",
    "Let the fretting fingers stay hovering over their frets instead of lifting away between strings."
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
