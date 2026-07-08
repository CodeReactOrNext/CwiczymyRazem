import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const chordToneImprovisationExercise: Exercise = {
  id: "chord_tone_improvisation",
  title: "Chord Tone Improvisation",
  description:
    "Target chord tones systematically over shifting backing tracks to build melodic intent.",
  whyItMatters: "Improvising by targeting chord tones (root, third, fifth, seventh) anchors your solos directly to the underlying harmony. This technique prevents random note selection, producing structured, harmonically rich solos that sound musical and professional.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 10,
  instructions: [
    "Choose a simple looping chord progression (2–4 chords) or any backing track with clear chord changes.",
    "Improvise using only the chord tones of the currently sounding chord — no non-chord tones are allowed.",
    "Change chords every bar or every two bars to increase difficulty.",
    "Do not start phrases on the root unless it is the only available option in the position you chose.",
    "Avoid repeating the same chord tone twice in a row within the same chord.",
    "At each chord change, aim for the smallest possible movement to a chord tone of the next chord.",
    "Perform the exercise from memory — actively track chord changes and their tones without visual aids.",
  ],
  tips: [
    "Mentally name the chord tones ahead of the chord change to avoid hesitation.",
    "If the tempo feels overwhelming, slow down but keep the chord-change frequency the same.",
    "Listen for smooth voice leading rather than vertical arpeggio motion.",
    "Resist falling back into scale patterns — every note must be justified by the chord.",
    "Focus on clarity and timing; even single notes should strongly imply the harmony."
  ],
  metronomeSpeed: null,
  relatedSkills: [
    "harmony",
    "improvisation",
    "chords",
  ],
};
