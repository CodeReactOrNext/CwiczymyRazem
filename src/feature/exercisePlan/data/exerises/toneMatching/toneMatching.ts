import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const toneMatchingExercise: Exercise = {
  id: "tone_matching_challenge",
  title: "Tone Matching Challenge",
  description: "Select any song and copy the sound of a selected fragment. This exercise focuses on recreating the timbre and nuance of a specific guitar part.",
  difficulty: "medium",
  category: "hearing",
  timeInMinutes: 15,
  instructions: [
    "Choose any song you like.",
    "Select a specific fragment (riff, solo, or chord progression) to focus on.",
    "Listen closely to the guitar tone in that fragment. Analyze the level of gain, EQ balance, pickup selection, and effects.",
    "Adjust your guitar and amplifier settings to match the sound as accurately as possible.",
    "Play along with the recording and try to blend in seamlessly.",
    "Refine your settings until your tone is indistinguishable from the recording."
  ],
  tips: [
    "Start by matching the clean tone characteristics before adding gain.",
    "Experiment with your guitar's volume and tone knobs.",
    "Consider the pick attack and where you are picking on the string.",
    "Listen for specific effects like reverb, delay, chorus, or compression."
  ],
  metronomeSpeed: null,
  relatedSkills: ["audio_production"],
};
