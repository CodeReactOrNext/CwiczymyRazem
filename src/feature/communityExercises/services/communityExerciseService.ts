import { logger } from "feature/logger/Logger";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { CreateCommunityExerciseInput, CommunityExercise, CommunityExerciseRating } from "feature/communityExercises/types";
import { db } from "utils/firebase/client/firebase.utils";

const COLLECTION = "communityExercises";
const RATINGS_SUBCOLLECTION = "ratings";

export const createCommunityExercise = async (
  input: CreateCommunityExerciseInput,
  authorId: string,
  authorUsername: string
): Promise<string | null> => {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...input,
      authorId,
      authorUsername,
      averageRating: 0,
      ratingCount: 0,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    logger.error(error, { context: "createCommunityExercise" });
    return null;
  }
};

export const getCommunityExercises = async (): Promise<CommunityExercise[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("isPublic", "==", true),
      orderBy("averageRating", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityExercise));
  } catch (error) {
    logger.error(error, { context: "getCommunityExercises" });
    return [];
  }
};

export const getCommunityExerciseById = async (exerciseId: string): Promise<CommunityExercise | null> => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, exerciseId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CommunityExercise;
  } catch (error) {
    logger.error(error, { context: "getCommunityExerciseById" });
    return null;
  }
};

export const updateCommunityExercise = async (
  exerciseId: string,
  input: CreateCommunityExerciseInput
): Promise<boolean> => {
  try {
    await updateDoc(doc(db, COLLECTION, exerciseId), {
      ...input,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    logger.error(error, { context: "updateCommunityExercise" });
    return false;
  }
};

export const getUserCommunityExercises = async (userId: string): Promise<CommunityExercise[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityExercise));
  } catch (error) {
    logger.error(error, { context: "getUserCommunityExercises" });
    return [];
  }
};

export const deleteCommunityExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, COLLECTION, exerciseId));
    return true;
  } catch (error) {
    logger.error(error, { context: "deleteCommunityExercise" });
    return false;
  }
};

export const getUserRatingForExercise = async (
  exerciseId: string,
  userId: string
): Promise<number | null> => {
  try {
    const ref = doc(db, COLLECTION, exerciseId, RATINGS_SUBCOLLECTION, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return (snap.data() as CommunityExerciseRating).rating;
  } catch (error) {
    logger.error(error, { context: "getUserRatingForExercise" });
    return null;
  }
};

export const rateExercise = async (
  exerciseId: string,
  userId: string,
  newRating: number
): Promise<boolean> => {
  try {
    const exerciseRef = doc(db, COLLECTION, exerciseId);
    const ratingRef = doc(db, COLLECTION, exerciseId, RATINGS_SUBCOLLECTION, userId);

    await runTransaction(db, async (tx) => {
      const exerciseSnap = await tx.get(exerciseRef);
      const ratingSnap = await tx.get(ratingRef);

      if (!exerciseSnap.exists()) throw new Error("Exercise not found");

      const exercise = exerciseSnap.data() as Omit<CommunityExercise, "id">;
      const prevRating = ratingSnap.exists() ? (ratingSnap.data() as CommunityExerciseRating).rating : null;

      let newCount = exercise.ratingCount;
      let newSum = exercise.averageRating * exercise.ratingCount;

      if (prevRating !== null) {
        newSum = newSum - prevRating + newRating;
      } else {
        newSum = newSum + newRating;
        newCount = newCount + 1;
      }

      const newAverage = newCount > 0 ? newSum / newCount : 0;

      tx.set(ratingRef, { rating: newRating, createdAt: serverTimestamp() });
      tx.update(exerciseRef, { averageRating: newAverage, ratingCount: newCount });
    });

    return true;
  } catch (error) {
    logger.error(error, { context: "rateExercise" });
    return false;
  }
};
