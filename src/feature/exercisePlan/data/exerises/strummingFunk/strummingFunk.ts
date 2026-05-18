import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const strummingFunkExercise: Exercise = {
  id: "strumming_funk",
  title: "Funk Rhythm Guitar",
  description: "Master 16th-note scratching, clean accents, and tight left-hand muting.",
  whyItMatters: "Funk rhythm relies heavily on percussive 'scratching' and precise accents. This exercise trains your fretting hand to squeeze the neck only on accented notes and relax to mute the strings on others, building elite hand sync.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Maintain a constant, rapid 16th-note strumming motion in your right hand.",
    "Squeeze the neck only on accented beats, relaxing instantly to create percussive scratches."
  ],
  tips: [
    "Ensure your fretting hand completely dampens the strings during scratches.",
    "Focus on making the accented chords pop out clearly against the muted scratches."
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
