import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Transcribed from a user-provided source — this is Riff A, the song's
// opening/main riff, not the clean interlude (that mislabel has been fixed
// below). Bar 1: low E (string 6) open pedal tone under a chromatic 7-6
// pickup fretted on the A string (string 5), confirmed against the owner's
// reference. Bar 3 repeats the same rhythm/pedal but with the 7-6 pickup
// back on the low E string (string 6) instead — bars 1 and 3 are NOT
// identical, per the owner's correction. Bar 2: three power chords
// (root on string 6, fifth+octave doubled on strings 5 and 4 — the classic
// one-shape-slid-down voicing), roots descending chromatically 5-4-3,
// continuing the same chromatic idea as bar 1. Rhythm confirmed against the
// owner's reference: chord 1 lands right on beat 1 (no leading rest), an
// eighth rest separates it from chord 2, another eighth rest separates
// chord 2 from chord 3, and chord 3 (a half note) rings for the rest of the
// bar. Bar 4 resolves the descent as single notes on string 6: 5-4-3-2-1.
export const masterOfPuppetsRiffPreviewExercise: Exercise = {
  id: "master_of_puppets_riff_preview",
  addedAt: "2026-08-06",
  title: "Riff Vault — Master of Puppets",
  description:
    "A short excerpt from the song's iconic palm-muted opening riff, including its power-chord accents.",
  whyItMatters:
    "This is the riff that opens (and keeps returning through) the whole song: chromatic palm-muted picking that snaps into power chords, testing both alternate-picking stamina and clean chord transitions.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 2,
  instructions: [
    "Palm-mute the single-note picking; let the power chords ring out briefly before the next phrase.",
    "Keep a steady eighth-note pulse; the open string acts as a pedal tone under the fretted notes.",
  ],
  tips: ["Start well under tempo and prioritize even note volume over speed."],
  metronomeSpeed: { min: 80, max: 220, recommended: 212 },
  relatedSkills: ["finger_independence"],
  tablature: [
    {
      timeSignature: [4, 4],
      beats: [
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 5, fret: 7 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 5, fret: 6 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        {
          notes: [
            { string: 6, fret: 5 },
            { string: 5, fret: 7 },
            { string: 4, fret: 7 },
          ],
          duration: 0.5,
        },
        { notes: [], duration: 0.5 },
        {
          notes: [
            { string: 6, fret: 4 },
            { string: 5, fret: 6 },
            { string: 4, fret: 6 },
          ],
          duration: 0.5,
        },
        { notes: [], duration: 0.5 },
        {
          notes: [
            { string: 6, fret: 3 },
            { string: 5, fret: 5 },
            { string: 4, fret: 5 },
          ],
          duration: 2,
        },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 7 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 6 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
      ],
    },
    {
      timeSignature: [4, 4],
      beats: [
        { notes: [{ string: 6, fret: 5 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 4 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 3 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 0 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 2 }], duration: 0.5 },
        { notes: [{ string: 6, fret: 1 }], duration: 0.5 },
      ],
    },
  ],
};
