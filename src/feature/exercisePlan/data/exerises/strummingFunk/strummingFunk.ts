import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const strummingFunkExercise: Exercise = {
  id: "strumming_funk",
  title: "Funk Rhythm Guitar",
  description: "16th-note funk strumming with heavy use of muted chucks and syncopation.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Funk strumming uses 16th-note subdivisions: 1 e & a 2 e & a 3 e & a 4 e & a.",
    "Your arm moves in a constant 16th-note pendulum. Most strums are muted chucks (×) — only accent notes ring out.",
    "Pattern A: the classic James Brown / Nile Rodgers approach — tight, clean, and relentless.",
    "Keep your fretting hand slightly relaxed so muted strums give a clean 'chk' — don't fully fret them.",
    "Gradually speed up. Funk grooves best between 90–110 BPM.",
  ],
  tips: [
    "The secret of funk: what you DON'T play is as important as what you do. Embrace the gaps.",
    "Your fretting hand does most of the work — muting and releasing strings creates the percussive texture.",
    "Record yourself and listen back. Funk rhythm is unforgiving — you'll hear if you're rushing.",
  ],
  metronomeSpeed: { min: 70, max: 115, recommended: 90 },
  relatedSkills: ["rhythm"],
  strummingPatterns: [
    {
      name: "Pattern A: Classic Funk",
      timeSignature: [4, 4],
      subdivisions: 4,
      strums: [
        { direction: "down", accented: true },   // 1
        { direction: "miss" },                    // e
        { direction: "up", muted: true },         // &
        { direction: "miss" },                    // a
        { direction: "down", muted: true },       // 2
        { direction: "miss" },                    // e
        { direction: "up", accented: true },      // &
        { direction: "miss" },                    // a
        { direction: "down", accented: true },    // 3
        { direction: "miss" },                    // e
        { direction: "up", muted: true },         // &
        { direction: "down", muted: true },       // a
        { direction: "miss" },                    // 4
        { direction: "miss" },                    // e
        { direction: "up", accented: true },      // &
        { direction: "miss" },                    // a
      ],
    },
    {
      name: "Pattern B: Percussive 16ths",
      timeSignature: [4, 4],
      subdivisions: 4,
      strums: [
        { direction: "down", accented: true },   // 1
        { direction: "miss" },
        { direction: "down", muted: true },      // &
        { direction: "up", muted: true },        // a
        { direction: "down", muted: true },      // 2
        { direction: "miss" },
        { direction: "up", accented: true },     // &
        { direction: "miss" },
        { direction: "down", accented: true },   // 3
        { direction: "up", muted: true },
        { direction: "down", muted: true },      // &
        { direction: "miss" },
        { direction: "down", muted: true },      // 4
        { direction: "miss" },
        { direction: "up", accented: true },     // &
        { direction: "up", muted: true },
      ],
    },
  ],
};
