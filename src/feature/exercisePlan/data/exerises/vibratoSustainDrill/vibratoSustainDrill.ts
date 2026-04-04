import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoSustainDrillExercise: Exercise = {
  id: "vibrato_sustain_drill",
  title: "Vibrato Sustain — Hold It for the Whole Bar",
  description:
    "Two notes (B on string 2, D on string 3) played as sustained whole notes with vibrato, then repeated with a deliberate quarter-note rest on beat 2. The rest is the point — you must start vibrato, pause completely, then re-enter clean vibrato without resetting your technique. Slow, wide, controlled. No rushing, no wobble.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measure 1 (reference — B, full bar): Strike B (string 2, fret 7). Start vibrato immediately and sustain it evenly for all 4 beats. Width and speed must stay constant from beat 1 to beat 4.",
    "Measure 2 (B with rest on beat 2): Strike B on beat 1 — quarter note, no vibrato yet. Rest on beat 2 — lift cleanly, silence. Beat 3: re-strike B and hold vibrato for a full half note (beats 3 and 4).",
    "Measure 3 (reference — D, full bar): Move to D (string 3, fret 7). Same idea — whole note, vibrato from the first moment, hold for 4 full beats.",
    "Measure 4 (D with rest on beat 2): Strike D on beat 1. Rest on beat 2. Re-strike D on beat 3 and sustain vibrato for the full half note.",
    "Measure 5 (resolve — B, full bar): Return to B, whole note vibrato. After all the interruptions, this should feel like a long, satisfying release.",
  ],
  tips: [
    "Vibrato comes from the wrist rotating, not from the finger bending up and down. If your wrist stays locked, you're doing finger vibrato — slower to develop and harder to control.",
    "The rest on beat 2 is a trap: most players rush back in on beat 3 too early. Count out loud — '1, rest, 3-4'. The silence must last exactly one beat.",
    "Width first, speed second. Start with slow, wide vibrato (1–2 oscillations per beat at 60 BPM) before trying to speed it up.",
    "When you re-enter after the rest (beat 3), the vibrato should start immediately — not half a beat later once the note 'warms up'. Strike and vibrate in the same moment.",
    "Record yourself. Listen back without watching your hands. Is the vibrato even from start to finish? Does the rest sound like silence or like a dead buzz?",
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  relatedSkills: ["vibrato", "articulation"],
  tablature: [
    // M1: B (str2, f7) whole note vibrato — referencja
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M2: B quarter (beat 1) → rest (beat 2) → B half note vibrato (beats 3-4)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 2, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
    // M3: D (str3, f7) whole note vibrato — nowa nuta
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M4: D quarter (beat 1) → rest (beat 2) → D half note vibrato (beats 3-4)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 7 }] },
        { duration: 1, notes: [] },
        { duration: 2, notes: [{ string: 3, fret: 7, isVibrato: true }] },
      ],
    },
    // M5: B (str2, f7) whole note vibrato — resolve
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 7, isVibrato: true }] },
      ],
    },
  ],
};
