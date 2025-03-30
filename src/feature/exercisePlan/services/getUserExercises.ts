import { logger } from "feature/logger/Logger";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { Exercise } from "../types/exercise.types";
import { EXERCISES_COLLECTION } from "./constants";


export const getUserExercises = async (userId: string): Promise<Exercise[]> => {
  try {
    const q = query(
      collection(db, EXERCISES_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as unknown as Exercise[];
  } catch (error) {
    logger.error(error, { context: "getUserExercises" });
    return [];
  }
}; 