import { pentatonicPlayalongExercise } from "feature/exercisePlan/data/exerises/pentatonicPlayalong/pentatonicPlayalong";
import authorAvatar from "public/images/avatars/guitarplayalogns.jpg";

import type { ExercisePlan } from "../../../types/exercise.types";

export const pentatonicPlayalongPlan: ExercisePlan = {
  id: "pentatonic_playalong_best_of_plan",
  title: "Pentatonic Best Of - Playalong",
  description: "Improve your pentatonic scales with this comprehensive video playalong session.",
  difficulty: "medium",
  category: "technique",
  exercises: [pentatonicPlayalongExercise],
  userId: "system",
  image: null,
  author: {
    name: "Guitar Playalongs",
    avatar: authorAvatar,
  },
};
