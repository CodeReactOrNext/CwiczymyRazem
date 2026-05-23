import { logger } from "feature/logger/Logger";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { ExercisePlan } from "../types/exercise.types";
import { EXERCISE_PLANS_COLLECTION } from "./constants";

export const getPublicExercisePlans = async (): Promise<ExercisePlan[]> => {
  try {
    const q = query(
      collection(db, EXERCISE_PLANS_COLLECTION),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExercisePlan));
  } catch (error) {
    logger.error(error, { context: "getPublicExercisePlans" });
    return [];
  }
};
