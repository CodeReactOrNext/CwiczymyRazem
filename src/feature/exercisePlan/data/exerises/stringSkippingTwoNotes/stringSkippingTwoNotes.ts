import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const stringSkippingTwoNotesExercise: Exercise = {
  id: "string_skipping_two_notes",
  title: "String Skipping — 2 Notes Per String",
  description:
    "The simplest possible string skipping pattern: 2 notes on string 6, skip string 5, 2 notes on string 4, skip string 3, 2 notes on string 2 — then reverse back down. All notes are from the A minor pentatonic box 1 (frets 5 and 7). One measure up, one measure down. The skipped string is always in between — your pick must arc cleanly over it every single time.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measure 1 (ascending): str6 fret 5 → str6 fret 7 → SKIP str5 → str4 fret 5 → str4 fret 7 → SKIP str3 → str2 fret 5 → str2 fret 8. Two notes on each string, one string skipped between each pair.",
    "Measure 2 (descending): reverse — str2 fret 8 → str2 fret 5 → SKIP str3 → str4 fret 7 → str4 fret 5 → SKIP str5 → str6 fret 7 → str6 fret 5. Same pattern, same skips, going back down.",
    "Loop M1→M2 continuously. The transition from the end of M2 back to the start of M1 is a full-string jump (str6 → str6) — keep the tempo locked.",
  ],
  tips: [
    "The pick must physically arc over the skipped string — do not try to sneak under it. Make a deliberate upward arc motion before landing on the target string.",
    "Practice the arc on open strings first: skip string 5 between string 6 and string 4 repeatedly, without fretting anything, until the motion feels natural.",
    "Alternate picking throughout: down on the first note of each string, up on the second. The skip happens on a down stroke — your pick arcs up over the skipped string and comes down onto the next.",
    "Go slow. At 60 BPM with 8th notes, you have plenty of time to aim. Accuracy matters far more than speed here.",
    "A dead buzz on the skipped string means your pick caught it. Reduce the arc height gradually until the skip is clean but not sloppy.",
  ],
  metronomeSpeed: { min: 50, max: 110, recommended: 70 },
  relatedSkills: ["hybrid_picking", "alternate_picking"],
  tablature: [
    // M1: Ascending — 2 notes per string, skipping str5 and str3
    // str6: A(f5) E(f7) | skip str5 | str4: D(f5) A(f7) | skip str3 | str2: E(f5) C(f8)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M2: Descending — same skips in reverse
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.5, notes: [{ string: 2, fret: 8 }] },
        { duration: 0.5, notes: [{ string: 2, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 4, fret: 5 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 7 }] },
        { duration: 0.5, notes: [{ string: 6, fret: 5 }] },
        { duration: 1, notes: [] },
      ],
    },
  ],
};
