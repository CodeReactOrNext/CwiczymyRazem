import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import economyPickingImage from "./image.png";

export const economyPickingAngularExercise: Exercise = {
  id: "economy_picking_angular",
  title: "Angular / Economy Picking",
  description:
    "Angular (economy) picking exercise focused on efficient string crossing, smooth sweep motions, and right-hand economy.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "Play the exercise slowly, following the natural direction of the pick when changing strings.",
    "When moving to a higher string, allow the pick to continue in the same direction (economy picking).",
    "Use small sweep motions when two notes fall on adjacent strings in the same pick direction.",
    "After completing the pattern, move it across all strings.",
    "Maintain consistent tone and volume for every note."
  ],
  tips: [
    "Do not force alternate picking — let the string changes dictate the pick direction.",
    "Keep the pick close to the strings to minimize motion.",
    "Focus on synchronization between both hands.",
    "Start at a slow tempo and increase speed only when the exercise feels relaxed.",
    "Stop if excessive tension appears in the picking hand."
  ],
  metronomeSpeed: { min: 60, max: 180, recommended: 60 },
  relatedSkills: [

  ],
  image: economyPickingImage
};