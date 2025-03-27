import { logger } from "feature/logger/Logger";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { ExercisePlan } from "../types/exercise.types";
import { EXERCISE_PLANS_COLLECTION } from "./constants";


export const getUserExercisePlans = async (userId: string): Promise<ExercisePlan[]> => {
  try {
    const q = query(
      collection(db, EXERCISE_PLANS_COLLECTION),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        category: data.category,
        exercises: data.exercises,
        totalDuration: data.totalDuration,
        isPrivate: data.isPrivate,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        userId: data.userId,
        completionHistory: data.completionHistory || [],
        image: data.image,
      };
    });
  } catch (error) {
    logger.error(error, { context: "getUserExercisePlans" });
    throw error;
  }
}; 