import { db } from "utils/firebase/client/firebase.utils";
import { doc, deleteDoc } from "firebase/firestore";
import { EXERCISE_PLANS_COLLECTION } from "./constants";
import { logger } from "feature/logger/Logger";

export const deleteExercisePlan = async (planId: string): Promise<void> => {
  try {
    const planRef = doc(db, EXERCISE_PLANS_COLLECTION, planId);
    await deleteDoc(planRef);
  } catch (error) {
    logger.error(`deleteExercisePlan failed for ${planId}`, { context: "deleteExercisePlan" });
    throw error;
  }
};
