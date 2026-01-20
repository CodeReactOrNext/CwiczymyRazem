import { logger } from "feature/logger/Logger";
import { doc, Timestamp,updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { ExercisePlan } from "../types/exercise.types";
import { EXERCISE_PLANS_COLLECTION } from "./constants";

export const updateExercisePlan = async (
  planId: string,
  plan: Partial<Omit<ExercisePlan, "id" | "userId">>
): Promise<void> => {
  try {
    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (
        obj !== null &&
        typeof obj === "object" &&
        !(obj instanceof Timestamp)
      ) {
        const newObj: any = {};
        Object.keys(obj).forEach((key) => {
          if (obj[key] !== undefined) {
            newObj[key] = sanitize(obj[key]);
          }
        });
        return newObj;
      }
      return obj;
    };

    const dataToUpdate = sanitize({
      ...plan,
      updatedAt: Timestamp.now(),
    });

    const planRef = doc(db, EXERCISE_PLANS_COLLECTION, planId);
    await updateDoc(planRef, dataToUpdate);
  } catch (error) {
    logger.error(`updateExercisePlan failed for ${planId}`, { context: "updateExercisePlan" });
    throw error;
  }
};
