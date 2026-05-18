import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import jpStretchingImage from "./image.png";


export const jpStretching: Exercise = {
  id: "jp_stretching",
  title: "Petrucci Stretching Exercise",
  description: "Expand your finger reach and hand flexibility with a wide-interval linear stretch.",
  whyItMatters: "Developing wide fretboard reach requires careful conditioning of the hand muscles. This exercise helps build structural reach, making complex jazz chords and wide-span metal/shred runs feel effortless and comfortable.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Position your thumb low behind the middle of the neck to maximize finger span.",
    "Execute each note cleanly, ensuring all fingers remain curved and relaxed."
  ],
  tips: [
    "Stop immediately if you feel sharp pain—stretch slowly and build reach over time.",
    "Keep your shoulder and elbow relaxed to allow your hand to rotate naturally."
  ],
  metronomeSpeed: null,
  relatedSkills: ["finger_independence"],
  image: jpStretchingImage
};