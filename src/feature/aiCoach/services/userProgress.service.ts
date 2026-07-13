import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export interface UserRoadmapStepResourceProgress {
  exerciseCompleted?: boolean;
  completedLessonIds?: string[];
}

export interface UserRoadmapProgress {
  roadmapId: string;
  userId: string;
  startedAt: string;
  updatedAt: string;
  stepProgress: Record<string, number>; // stepId -> sessionsCompleted
  resourceProgress?: Record<string, UserRoadmapStepResourceProgress>; // stepId -> checked resources
}

const COLLECTION = "userRoadmapProgress";

const docId = (userId: string, roadmapId: string) => `${userId}_${roadmapId}`;

export const firebaseGetAllUserProgress = async (
  userId: string
): Promise<UserRoadmapProgress[]> => {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserRoadmapProgress);
};

export const firebaseUpdateUserProgress = async (
  userId: string,
  roadmapId: string,
  stepProgress: Record<string, number>,
  resourceProgress: Record<string, UserRoadmapStepResourceProgress>
): Promise<void> => {
  const ref = doc(db, COLLECTION, docId(userId, roadmapId));
  const now = new Date().toISOString();
  await setDoc(
    ref,
    { roadmapId, userId, stepProgress, resourceProgress, updatedAt: now, startedAt: now },
    { merge: true }
  );
};
