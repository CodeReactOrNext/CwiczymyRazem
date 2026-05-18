import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const mutingSpotlightDrillExercise: Exercise = {
  id: "muting_spotlight_drill",
  title: "Muting Spotlight — Pick One, Kill the Rest",
  description:
    "Isolate single notes while aggressively muting all adjacent strings under gain.",
  whyItMatters: "High gain amplifies every minor vibration on the guitar. Isolating a single note while resting your picking hand palm on lower strings and fretting index finger on higher strings creates a dead-silent background for your leads.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Dampen the lower strings firmly with the side of your picking palm.",
    "Rest your unused fretting fingers lightly over the higher strings to deaden them."
  ],
  tips: [
    "Strike the target note confidently; your muting block should completely silence other strings.",
    "Listen for a crisp, focused note attack followed by absolute silence upon release."
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 55 },
  relatedSkills: ["articulation"],
  tablature: [
    // M1: G(0) A(2) B(4) rest — reference, all ringing
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M2: X X B(4) rest — only B rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M3: X A(2) X rest — only A rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 4, isDead: true }] },
        { duration: 1, notes: [] },
      ],
    },
    // M4: G(0) X X rest — only G rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 4, isDead: true }] },
        { duration: 1, notes: [] },
      ],
    },
    // M5: G(0) X B(4) rest — two notes ring, A is killed
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
        { duration: 1, notes: [] },
      ],
    },
    // M6: G(0) A(2) B(4) rest — resolve, full clean motif
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 0 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 4 }] },
        { duration: 1, notes: [] },
      ],
    },
  ],
};
