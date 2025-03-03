import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";

import type { ExercisePlan } from "../../types/exercise.types";

export const defaultPlans: ExercisePlan[] = [
  {
    id: "beginner_technique",
    title: "Plan techniczny dla początkujących",
    description: "Podstawowy plan ćwiczeń technicznych dla początkujących gitarzystów",
    difficulty: "beginner",
    category: "technique",
    exercises: [spiderBasicExercise],
    totalDuration: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "system",
  },
]; 