import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const metalGallopExercise: Exercise = {
  id: "metal_gallop",
  title: "Iron Gallop — Thrash Rhythm Drill",
  description:
    "Pure gallop rhythm (16th–16th–8th) on the low E string with palm mute. Each measure is a looping single-note pattern with fret shifts — E, A, G. Clean, mechanical picking with no chords. Think Metallica 'Battery', Iron Maiden 'The Trooper'.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "The gallop cell = [16th PM] [16th PM] [8th PM]. Three strokes, one quarter note. Repeated endlessly.",
    "Measure 1: Pure E (fret 0), 4 identical gallop cells. Pure hand synchronization — nothing else.",
    "Measure 2: E × 2 beats, then A (fret 5) × 1, G (fret 3) × 1. Your fretting hand shifts position without interrupting the picking rhythm.",
    "Loop: play M1→M2→M1→M2→... non-stop. Two measures, over and over.",
  ],
  tips: [
    "Your picking arm moves like a pendulum on 16th notes NON-STOP — even when the two 16th notes are muted silence. Never stop the arm.",
    "Palm mute: the side of your picking hand rests on the bridge. Too far forward = no muting. Too close to the neck = dead tone. Find the sweet spot.",
    "Fret shifts (E→A, G) must be invisible to the rhythm. Practice each shift in isolation × 8 before combining them.",
    "Record yourself. The gallop should sound like a galloping horse — even 'dum-dum-DAH dum-dum-DAH', not chaotic strumming.",
  ],
  metronomeSpeed: { min: 80, max: 180, recommended: 120 },
  relatedSkills: ["rhythm", "articulation"],
  tablature: [
    // M1: Czyste E (fret 0) — 4 identyczne komórki gallopu, tylko str6
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
      ],
    },
    // M2: E × 2 beaty, A (fret 5) × 1, G (fret 3) × 1
    {
      timeSignature: [4, 4],
      beats: [
        // E
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        // E
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 0, isPalmMute: true }] },
        // A (fret 5)
        { duration: 0.25, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 5, isPalmMute: true }] },
        // G (fret 3)
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 0.25, notes: [{ string: 6, fret: 3, isPalmMute: true }] },
        { duration: 0.5,  notes: [{ string: 6, fret: 3, isPalmMute: true }] },
      ],
    },
  ],
};
