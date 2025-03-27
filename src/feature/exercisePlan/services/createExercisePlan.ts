import { EXERCISE_PLANS_COLLECTION } from "feature/exercisePlan/services/constants";
import { logger } from "feature/logger/Logger";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { ExercisePlan } from "../types/exercise.types";



export const createExercisePlan = async (
  userId: string,
  plan: Omit<ExercisePlan, "id" | "userId" >
): Promise<string> => {
  try {
    const planToSave = {
      ...plan,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, EXERCISE_PLANS_COLLECTION), planToSave);
    return docRef.id;
  } catch (error) {
    logger.error(error, { context: "createExercisePlan" });
    throw error;
  }
}; 