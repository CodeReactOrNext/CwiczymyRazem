import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import legatoSextupletsImage from "./image.png";

export const legatoSextuplets457Exercise: Exercise = {
  id: "legato_sextuplets_4_5_7",
  title: "Legato Sextuplets – 4-5-7",
  description:
    "Legato exercise based on 4-5-7 fingerings played in sextuplets, combining hammer-ons and pull-offs to develop left-hand strength, control, and rhythmic precision.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "Use hammer-ons for ascending notes (4–5–7).",
    "Use pull-offs for descending notes (7–5).",
    "Play each group as an even sextuplet subdivision.",
    "Repeat the written pattern three times before moving on."
  ],
  tips: [
    "Make hammer-ons and pull-offs as loud and clear as the picked note.",
    "Keep fingers close to the fretboard to maintain legato smoothness.",
    "Avoid tension in the thumb and wrist of the fretting hand.",
    "Use minimal picking motion — the right hand should stay relaxed.",
    "Count the sextuplets internally to keep timing stable."
  ],
  metronomeSpeed: { min: 60, max: 180, recommended: 60 },
  relatedSkills: [ ],
  image: legatoSextupletsImage
};