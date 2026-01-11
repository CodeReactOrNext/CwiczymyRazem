import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const guideToneVoiceLeadingExercise: Exercise = {
  id: "guide_tone_voice_leading",
  title: "Guide Tone Voice-Leading Drill",
  description:
    "Exercise focused on voice leading and harmonic awareness by using only guide tones (3rds and 7ths) to outline chord progressions with minimal melodic movement.",
  difficulty: "medium",
  category: "theory",
  timeInMinutes: 10,
  instructions: [
    "Choose a looping chord progression or any backing track with clear chord changes (e.g., ii–V–I in a major key: Dm7 – G7 – Cmaj7).",
    "Set a slow tempo (around 60–80 BPM) and use a clean guitar tone.",
    "For each chord, identify its 3rd and 7th and locate them on the fretboard in a single position.",
    "Play only one note per chord change: either the 3rd or the 7th of the current chord, and hold it until the next chord.",
    "When the chord changes, always move to the closest possible guide tone (3rd or 7th) of the new chord.",
    "Play through the progression starting on the 3rd of the first chord, connecting each new chord to the nearest guide tone.",
    "Repeat the exercise starting on the 7th of the first chord, again choosing the nearest guide tone at every change.",
    "Optionally, anticipate chord changes by playing the next guide tone slightly before the chord change."
  ],
  tips: [
    "Say the guide tones out loud while practicing to reinforce chord awareness.",
    "Aim for minimal finger movement between notes — small shifts indicate good voice leading.",
    "Listen for half-step resolutions between chords; they signal correct guide-tone connections.",
    "Avoid jumping to guide tones in different octaves if a closer option exists.",
    "With so few notes, use dynamics and sustain to keep the line musical."
  ],
  metronomeSpeed: null,
  relatedSkills: ["chord_theory", "harmony", "music_theory", "ear_training"],
};
