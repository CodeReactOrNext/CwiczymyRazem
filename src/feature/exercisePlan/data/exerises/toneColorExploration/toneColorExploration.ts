import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const toneColorExplorationExercise: Exercise = {
  id: "tone_color_exploration",
  title: "Tonal Palette Discovery",
  description: "Explore the full spectrum of tones available from picking position and technique.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 10,
  instructions: [
    "Play the same simple phrase in three different pickup positions:",
    "1. Bridge position - bright, cutting tone with sharp attack.",
    "2. Middle position - balanced, clear tone with good definition.",
    "3. Neck position - warm, mellow tone with soft attack.",
    "Experiment with pick angle: perpendicular vs. angled attack.",
    "Try different pick depths: surface picking vs. deep digging.",
    "Listen carefully to how each variation changes the character of the sound."
  ],
  tips: [
    "Bridge position = bright and aggressive, perfect for cutting through a mix.",
    "Neck position = smooth and warm, ideal for jazz or blending with other instruments.",
    "Middle position = the 'sweet spot' - versatile for most musical situations.",
    "Pick angle affects tone: parallel to strings = mellow, angled = brighter.",
    "Depth matters: shallow = glassy and clear, deep = chunky and aggressive.",
    "Mark Knopfler uses picking position changes as a compositional tool.",
    "Each position has a purpose in the sonic palette - learn when to use each.",
    "Combine with dynamics for even more tonal variations."
  ],
  metronomeSpeed: null,
  relatedSkills: ["audio_production"],
};
