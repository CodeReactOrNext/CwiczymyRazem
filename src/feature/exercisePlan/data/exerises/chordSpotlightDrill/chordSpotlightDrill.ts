import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const chordSpotlightDrillExercise: Exercise = {
  id: "chord_spotlight_drill",
  title: "Chord Spotlight — D Major, 2 Dead",
  description:
    "A D major triad (strings 3-2-1: fret 2-3-2, notes A-D-F#) struck as a chord on every beat. In measures 2–4, only one note rings — the other two are dead muted hits. All three strings are attacked with the same pick stroke every time. Because all notes are fretted, both hands can be used for muting — but you must decide which technique fits each case.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Measure 1 (reference): Full D major chord on every beat — A(str3,f2) + D(str2,f3) + F#(str1,f2). Four quarter notes. Hold the full chord shape and let all three notes ring cleanly.",
    "Measure 2 (spotlight: F# only): X + X + F#(str1,f2). Hold only the first-string finger down firmly. Kill strings 3 and 2 by releasing fretting pressure on those fingers — they stay on the string but go flat/loose, producing a dead thud.",
    "Measure 3 (spotlight: D only): X + D(str2,f3) + X. D is in the middle. Release pressure on strings 3 and 1 simultaneously while keeping string 2 pressed firmly. This is the hardest measure — two fingers must go limp while one stays active.",
    "Measure 4 (spotlight: A only): A(str3,f2) + X + X. Keep string 3 pressed, release strings 2 and 1. The A rings out as the bass note of the chord, the other two are dead.",
    "Measure 5 (resolve): Full D major chord again, all four beats. Feel the difference after M2–M4 — the chord should sound richer and more intentional now.",
  ],
  tips: [
    "Because all notes are fretted, the left hand is your primary muting tool: reduce finger pressure on the strings you want to kill — they stay touching the string (producing a dead X) but stop ringing. No need to lift your fingers off entirely.",
    "Dead notes must sound like percussive thuds, not like you avoided the string. Strike all three strings every time with the same confident pick stroke.",
    "M3 (spotlight: D) is the hardest. Middle finger on string 2 stays firm while index and ring fingers both go limp simultaneously. Practice just the hand shape change without the pick first.",
    "The ringing note must sustain for the full beat before the next hit. Don't rush — let it speak.",
    "Start at 50 BPM. The goal is consistency: every dead note sounds identical, every ringing note sounds identical, for all four beats of a measure.",
  ],
  metronomeSpeed: { min: 40, max: 100, recommended: 60 },
  relatedSkills: ["articulation"],
  tablature: [
    // M1: Full D major — A(str3,f2) + D(str2,f3) + F#(str1,f2), all ringing
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
      ],
    },
    // M2: X(A) + X(D) + F# — only F# rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2 }] },
      ],
    },
    // M3: X(A) + D + X(F#) — only D rings (hardest)
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3 }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3 }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3 }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2, isDead: true }, { string: 2, fret: 3 }, { string: 1, fret: 2, isDead: true }] },
      ],
    },
    // M4: A + X(D) + X(F#) — only A rings
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2, isDead: true }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3, isDead: true }, { string: 1, fret: 2, isDead: true }] },
      ],
    },
    // M5: Full D major — resolve
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
        { duration: 1, notes: [{ string: 3, fret: 2 }, { string: 2, fret: 3 }, { string: 1, fret: 2 }] },
      ],
    },
  ],
};
