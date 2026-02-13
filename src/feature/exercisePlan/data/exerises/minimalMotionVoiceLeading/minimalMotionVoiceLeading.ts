import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const minimalMotionVoiceLeadingExercise: Exercise = {
  id: "minimal_motion_voice_leading",
  title: "Minimal-Motion Voice Leading",
  description:
    "Advanced voice-leading drill: connect chord changes with the smallest possible melodic movement to create smooth, harmonically aware lines.",
  difficulty: "hard",
  category: "theory",
  timeInMinutes: 10,
  instructions: [
    "Choose a looping chord progression (3–4 chords) or any backing track with clear chord changes.",
    "Improvise with a constant focus on minimal movement: at every chord change, move to the closest possible chord tone of the next chord (preferably a common tone, otherwise a half-step; whole-step only if needed).",
    "Keep your note choices mostly to chord tones so the harmony stays clearly implied; you may use passing notes only if they preserve minimal motion between targets.",
    "During the first pass, play only the connections: sustain a note into the chord change, then shift minimally to the next chord’s nearest tone (avoid extra notes).",
    "On the next pass, add short motifs between changes, but ensure the last note before the change connects minimally into the first note of the next chord.",
    "Increase difficulty by changing chords every bar (or every two bars at most) and staying in one fretboard area instead of jumping positions.",
    "Before each chord change, decide in advance which nearest tone you will land on for the next chord (no last-second guessing).",
    "If you make a large jump at a chord change or hit a wrong tone, restart the loop and solve that transition with a smaller movement."
  ],
  tips: [
    "Actively listen for smooth stepwise motion (or a held common tone) rather than big melodic leaps.",
    "If you get stuck, slow the tempo but keep the chord-change frequency the same.",
    "Try multiple voice-leading paths across the same progression (one descending line, one ascending line, one mostly common-tone).",
    "Avoid autopilot shapes — the goal is choosing the nearest target, not running familiar patterns.",
    "Prioritize timing: land exactly on the chord change even if you play fewer notes."
  ],
  metronomeSpeed: null,
  relatedSkills: [
    "chords",
    "harmony",
    "music_theory",
    "ear_training",
    "phrasing"
  ],
};
