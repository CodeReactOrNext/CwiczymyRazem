import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { i18n } from "next-i18next";
import { db } from "utils/firebase/client/firebase.utils";

import { exercisesAgregat } from "../data/plans";
import type { Exercise,ExercisePlan } from "../types/exercise.types";

const EXERCISE_PLANS_COLLECTION = "exercisePlans";
const EXERCISE_PROGRESS_COLLECTION = "exerciseProgress";
const EXERCISES_COLLECTION = "exercises";

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
      };
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }
};

export const createExercisePlan = async (
  userId: string,
  plan: Omit<ExercisePlan, "id" | "createdAt" | "updatedAt" | "userId" | "completionHistory">
): Promise<string> => {
  try {
    const planToSave = {
      ...plan,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      completionHistory: [],
    };

    const docRef = await addDoc(collection(db, EXERCISE_PLANS_COLLECTION), planToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error creating plan:", error);
    throw error;
  }
};

export const updateExercisePlan = async (
  planId: string,
  updates: Partial<ExercisePlan>
) => {
  try {
    const planRef = doc(db, EXERCISE_PLANS_COLLECTION, planId);
    await updateDoc(planRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating exercise plan:", error);
    throw error;
  }
};

export const deleteExercisePlan = async (planId: string) => {
  try {
    await deleteDoc(doc(db, EXERCISE_PLANS_COLLECTION, planId));
  } catch (error) {
    console.error("Error deleting exercise plan:", error);
    throw error;
  }
};

export const updateExerciseProgress = async (
  userId: string,
  exerciseId: string,
  progress: {
    timeSpent: number;
    speed?: number;
    notes?: string;
    rating?: number;
  }
) => {
  try {
    const progressRef = doc(
      db,
      EXERCISE_PROGRESS_COLLECTION,
      `${userId}_${exerciseId}`
    );
    await updateDoc(progressRef, {
      ...progress,
      lastPracticed: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating exercise progress:", error);
    throw error;
  }
};

export const getExercises = async (): Promise<Exercise[]> => {
  return exercisesAgregat;
};

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
    console.error("Error fetching exercises:", error);
    throw error;
  }
};

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
      description: data.description,
      difficulty: data.difficulty,
      category: data.category,
      exercises: data.exercises.map((exercise: any) => ({
        ...exercise,
        title: exercise.title[i18n?.language as keyof typeof exercise.title] || exercise.title,
        description: exercise.description[i18n?.language as keyof typeof exercise.description] || exercise.description,
      })),
      userId: data.userId,
    };
  } catch (error) {
    console.error("Error fetching plan:", error);
    throw error;
  }
};
