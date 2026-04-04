import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoFingerIsolationExercise: Exercise = {
  id: "vibrato_finger_isolation",
  title: "Vibrato — One Finger at a Time",
  description:
    "Four measures, one finger per measure: index (1), middle (2), ring (3), pinky (4). Each finger frets the same string (string 2, B) at its natural comfortable position and sustains vibrato for a full whole note. Most players have a strong ring finger vibrato and a nearly dead index or pinky — this exercise forces you to confront and train each finger individually.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Measure 1 — Index finger (finger 1): Fret B (string 2, fret 5). Index finger only on the string. No support from other fingers. The index is often weak at vibrato — let it work alone.",
    "Measure 2 — Middle finger (finger 2): Fret B (string 2, fret 6). Middle finger only. Usually stronger than index but weaker than ring. Pay attention to whether the wrist motion changes between fingers.",
    "Measure 3 — Ring finger (finger 3): Fret B (string 2, fret 7). Ring finger only — this is most players' strongest vibrato finger. Use this measure to establish your reference sound, then try to match it in other measures.",
    "Measure 4 — Pinky finger (finger 4): Fret B (string 2, fret 8). Pinky only — the hardest. The pinky is the weakest finger and most players produce a nervous, uneven vibrato here. Slow down if needed.",
    "After looping all four: go back to the weakest finger and spend extra time on it. That finger is where the real work is.",
  ],
  tips: [
    "One finger at a time means only that finger is pressing the string. You can loosely rest the other fingers nearby for stability, but they must not contribute any fretting pressure.",
    "The ring finger is the 'teacher' — it usually has the most natural vibrato. Play M3 first to hear what a good vibrato should sound like from your own hand, then try to replicate it with the other fingers.",
    "Pinky vibrato: the pinky is short and weak, but it can be trained. Keep the wrist rotation the same — the motion source doesn't change between fingers. Only the contact point changes.",
    "Index vibrato is limited by thumb position. If the thumb is gripping over the neck, the index has almost no freedom. Move the thumb behind the neck before playing M1.",
    "Even oscillations: count the waves. At 55 BPM, aim for 2 oscillations per beat. Count them out loud — '1-up-down, 2-up-down, 3-up-down, 4-up-down'. If you lose count, the vibrato is not even.",
  ],
  metronomeSpeed: { min: 40, max: 75, recommended: 55 },
  relatedSkills: ["vibrato", "finger_independence", "articulation"],
  tablature: [
    // M1: Index finger — str2, fret 5 (A#/Bb)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 5, isVibrato: true }] },
      ],
    },
    // M2: Middle finger — str2, fret 6 (B)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 6, isVibrato: true }] },
      ],
    },
    // M3: Ring finger — str2, fret 7 (C)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M4: Pinky finger — str2, fret 8 (C#)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 8, isVibrato: true }] },
      ],
    },
  ],
};
