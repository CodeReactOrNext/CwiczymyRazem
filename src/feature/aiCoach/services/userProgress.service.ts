import type { PhaseCheckResult } from "feature/aiCoach/types/phaseCheck.types";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export interface UserRoadmapStepResourceProgress {
  exerciseCompleted?: boolean;
  completedLessonIds?: string[];
  songCompleted?: boolean;
}

export interface UserRoadmapProgress {
  roadmapId: string;
  userId: string;
  startedAt: string;
  updatedAt: string;
  stepProgress: Record<string, number>; // stepId -> sessionsCompleted
  resourceProgress?: Record<string, UserRoadmapStepResourceProgress>; // stepId -> checked resources
  phaseChecks?: Record<string, PhaseCheckResult>; // phaseId -> checkpoint result
}

const COLLECTION = "userRoadmapProgress";

const docId = (userId: string, roadmapId: string) => `${userId}_${roadmapId}`;

export const firebaseGetAllUserProgress = async (
  userId: string,
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
  resourceProgress: Record<string, UserRoadmapStepResourceProgress>,
  phaseChecks?: Record<string, PhaseCheckResult>,
): Promise<void> => {
  const ref = doc(db, COLLECTION, docId(userId, roadmapId));
  const now = new Date().toISOString();
  await setDoc(
    ref,
    {
      roadmapId,
      userId,
      stepProgress,
      resourceProgress,
      ...(phaseChecks ? { phaseChecks } : {}),
      updatedAt: now,
      startedAt: now,
    },
    { merge: true },
  );
};

/**
 * Opens a player's own run through a roadmap — somebody else's, from Player
 * Roadmaps. An empty progress document is what "following" a roadmap is: the
 * listing counts it, and every session after it lands in it.
 */
export const firebaseStartRoadmap = async (
  userId: string,
  roadmapId: string,
): Promise<void> => {
  const ref = doc(db, COLLECTION, docId(userId, roadmapId));
  const now = new Date().toISOString();
  await setDoc(
    ref,
    {
      roadmapId,
      userId,
      stepProgress: {},
      resourceProgress: {},
      updatedAt: now,
      startedAt: now,
    },
    { merge: true },
  );
};
