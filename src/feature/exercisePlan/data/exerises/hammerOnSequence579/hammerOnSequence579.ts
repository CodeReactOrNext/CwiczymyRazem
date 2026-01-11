import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import hammerOnSequenceImage from "./image.png";

export const hammerOnSequence579Exercise: Exercise = {
  id: "hammer_on_sequence_5_7_9",
  title: "Hammer-ons – 5-7-9 Sequence",
  description:
    "Hammer-on focused exercise using a 5-7-9 sequence across strings, designed to build left-hand strength, finger independence, and legato clarity.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Pick only the first note on each string, then perform hammer-ons for the remaining notes (5–7–9).",
    "Use consistent fingerings and keep all hammer-ons strong and clear.",
    "Repeat the written pattern three times before moving on.",
    "Move the sequence across all indicated strings.",
    "Let each note ring clearly without relying on the picking hand."
  ],
  tips: [
    "Hammer with confidence — aim for volume equal to the picked note.",
    "Keep fingers close to the fretboard to minimize motion.",
    "Avoid squeezing the neck; use finger strength, not tension.",
    "Maintain steady timing even though most notes are legato.",
    "Mute unused strings with both hands to keep the exercise clean."
  ],
  metronomeSpeed: { min: 60, max: 180, recommended: 60 },
  relatedSkills: [

  ],
  image: hammerOnSequenceImage
};