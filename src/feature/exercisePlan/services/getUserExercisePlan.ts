import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { logger } from "feature/logger/Logger";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { i18n } from "utils/translation";

import type { Exercise, ExercisePlan } from "../types/exercise.types";
import { EXERCISE_PLANS_COLLECTION } from "./constants";

const exercisesById = new Map(exercisesAgregat.map(exercise => [exercise.id, exercise]));


export const getUserExercisePlan = async (userId: string, planId: string): Promise<ExercisePlan | null> => {
  try {
    const docRef = doc(db, EXERCISE_PLANS_COLLECTION, planId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().userId !== userId) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      description: data.description,
      difficulty: data.difficulty,
      category: data.category,
      exercises: data.exercises.map((exercise: Exercise) => {
        const canonical = exercisesById.get(exercise.id);
        return {
          ...exercise,
          // Firestore can't persist function fields (e.g. rollHuntTarget, rerollCustomGoal),
          // so they're stripped on save — restore them from the in-memory catalog.
          rollHuntTarget: canonical?.rollHuntTarget,
          rerollCustomGoal: canonical?.rerollCustomGoal,
          title: exercise.title[i18n?.language as keyof typeof exercise.title] || exercise.title,
          description: exercise.description[i18n?.language as keyof typeof exercise.description] || exercise.description,
        };
      }),
      userId: data.userId,
      image: data.image,
    };
  } catch (error) {
    logger.error(error, { context: "getUserExercisePlan" });
    throw error;
  }
}; 