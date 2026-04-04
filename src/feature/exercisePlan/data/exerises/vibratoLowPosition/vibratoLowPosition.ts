import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoLowPositionExercise: Exercise = {
  id: "vibrato_low_position",
  title: "Vibrato — Low Position (Frets 1–5)",
  description:
    "Vibrato practice in the low position (frets 1–5) where fret spacing is widest and string tension is highest. Each measure is a single sustained note with continuous vibrato. Low position is the hardest place to do vibrato — the string fights back more, the frets are far apart, and most players produce an uneven, stiff result here. Four notes across measures, each on a different string.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "Measure 1: E (string 1, fret 5). Whole note, vibrato from the first moment. The high E string is thin and responsive — use it to feel the correct wrist rotation before moving to heavier strings.",
    "Measure 2: C (string 2, fret 1). The first fret demands maximum reach. Your thumb position is critical here — it should be behind the neck, not gripping over the top.",
    "Measure 3: G (string 3, fret 5). Middle of the fretboard range, heavier string. The vibrato needs more wrist force to move this string noticeably.",
    "Measure 4: D (string 4, fret 5). Even heavier string tension. You will feel the resistance — push through it with full wrist rotation, not just a finger wiggle.",
    "Loop all four measures. Each note should sound like a controlled, even wave — not a nervous shake.",
  ],
  tips: [
    "Low position is harder than high position because string tension is higher and fret spacing is wider. Don't be discouraged if it feels stiff at first — it takes longer to develop here.",
    "Wrist rotation is the engine. Imagine turning a doorknob slowly back and forth — the wrist drives the motion, the finger just transfers it to the string.",
    "Thumb behind the neck: in low position especially, a wrapped thumb kills your wrist freedom. Keep the thumb pointed upward behind the neck so the wrist can rotate freely.",
    "Width before speed: start with slow, wide oscillations (1 per beat at 50 BPM). Once the width is consistent, gradually increase speed.",
    "Listen for evenness: each oscillation up and each oscillation down should take the same amount of time. Record yourself — the metronome will reveal any wobble.",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  relatedSkills: ["vibrato", "articulation"],
  tablature: [
    // M1: E — str1, fret 5 — high e string, thin and responsive
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 1, fret: 5, isVibrato: true }] },
      ],
    },
    // M2: C — str2, fret 1 — first fret, maximum tension challenge
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 1, isVibrato: true }] },
      ],
    },
    // M3: G — str3, fret 5 — heavier string, more force needed
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 3, fret: 5, isVibrato: true }] },
      ],
    },
    // M4: D — str4, fret 5 — heaviest string in set, full wrist commitment
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 4, fret: 5, isVibrato: true }] },
      ],
    },
  ],
};
