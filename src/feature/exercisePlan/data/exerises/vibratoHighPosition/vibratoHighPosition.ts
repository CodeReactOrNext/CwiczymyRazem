import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoHighPositionExercise: Exercise = {
  id: "vibrato_high_position",
  title: "Vibrato — High Position (Frets 12–17)",
  description:
    "Vibrato practice in the high position (frets 12–17) where fret spacing is narrowest and string tension is lowest. The string moves easily here — which means control becomes the challenge, not force. Four sustained whole notes across different strings. High position is where most players first develop a good-sounding vibrato, but it is easy to overdo it and produce a wide, uncontrolled wobble.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "Measure 1: E (string 1, fret 12). Open harmonic position — the string responds immediately to any pressure change. Keep the vibrato width moderate, not exaggerated.",
    "Measure 2: B (string 2, fret 17). High up the neck, very close fret spacing. Your finger barely needs to move — tiny wrist rotation produces a lot of pitch change here.",
    "Measure 3: G (string 3, fret 12). Back to fret 12, heavier string. Match the vibrato width you used on string 1 — consistency across strings is the goal.",
    "Measure 4: D (string 4, fret 14). Wider fret spacing than fret 17 but still well into high position. The string is heavier, so slightly more wrist pressure is needed to get the same pitch movement.",
    "Loop all four measures. The challenge here is restraint — resist the urge to go wide and fast just because the string lets you.",
  ],
  tips: [
    "High position is forgiving — the string moves easily. Use this to develop the correct wrist motion before taking it down to lower positions.",
    "Less is more up here. A narrow, controlled vibrato sounds more musical than a wild, over-the-top wobble. Aim for a subtle half-step pitch variation at most.",
    "Fret spacing is small in high position: your oscillations don't need to be large. Think of it as a gentle shimmer, not a dramatic wave.",
    "Equal up and down: the string should pitch up and return to pitch symmetrically. Many players push up fine but don't return to pitch cleanly — the note ends flat.",
    "Use a tuner to check: play the note without vibrato, then add vibrato. The center pitch (where the note returns between oscillations) should match the tuner reading.",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  relatedSkills: ["vibrato", "articulation"],
  tablature: [
    // M1: E — str1, fret 12 — harmonic position, very responsive
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 1, fret: 12, isVibrato: true }] },
      ],
    },
    // M2: B — str2, fret 17 — tiny fret spacing, minimal motion needed
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 17, isVibrato: true }] },
      ],
    },
    // M3: G — str3, fret 12 — match width from M1 on heavier string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 3, fret: 12, isVibrato: true }] },
      ],
    },
    // M4: D — str4, fret 14 — heavier string, more wrist force
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 4, fret: 14, isVibrato: true }] },
      ],
    },
  ],
};
