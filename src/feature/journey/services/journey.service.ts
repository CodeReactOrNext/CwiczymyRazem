import type { Song } from "feature/songs/types/songs.type";
import { collection, doc, documentId, getDoc, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

import type { JourneyProgressDocument, JourneyStepProgress } from "../types/journey.types";

const COLLECTION = "journeyProgress";

export const firebaseGetJourneyProgress = async (
  userId: string
): Promise<JourneyProgressDocument | null> => {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as JourneyProgressDocument;
};

export const firebaseInitJourneyProgress = async (
  userId: string
): Promise<JourneyProgressDocument> => {
  const initial: JourneyProgressDocument = {
    userId,
    moduleProgress: {},
    updatedAt: new Date().toISOString(),
  };
  const ref = doc(db, COLLECTION, userId);
  await setDoc(ref, initial);
  return initial;
};

export const firebaseCompleteJourneyStep = async (
  userId: string,
  moduleId: string,
  stepId: string
): Promise<void> => {
  const ref = doc(db, COLLECTION, userId);
  const stepData: JourneyStepProgress = {
    completed: true,
    completedAt: new Date().toISOString(),
  };
   
  await updateDoc(ref, {
    [`moduleProgress.${moduleId}.steps.${stepId}`]: stepData,
    updatedAt: new Date().toISOString(),
  } as any);
};

// The star rule itself is pure and lives apart from Firestore (utils/examStars.ts).
export { accuracyToStars, EXAM_STAR_ACCURACY, EXAM_STAR_ON_TIME } from "../utils/examStars";

export const firebaseCompleteJourneyStepWithStars = async (
  userId: string,
  moduleId: string,
  stepId: string,
  stars: 1 | 2 | 3
): Promise<void> => {
  const ref = doc(db, COLLECTION, userId);
  const stepData: JourneyStepProgress = {
    completed: true,
    completedAt: new Date().toISOString(),
    stars,
  };
   
  await updateDoc(ref, {
    [`moduleProgress.${moduleId}.steps.${stepId}`]: stepData,
    updatedAt: new Date().toISOString(),
  } as any);
};

export const getSongsByIds = async (ids: string[]): Promise<Song[]> => {
  if (ids.length === 0) return [];
  const snap = await trackedGetDocs(
    query(collection(db, "songs"), where(documentId(), "in", ids))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Song));
};

export const firebaseStartJourneyStep = async (
  userId: string,
  moduleId: string,
  stepId: string
): Promise<void> => {
  const ref = doc(db, COLLECTION, userId);
  const stepData: JourneyStepProgress = {
    completed: false,
    startedAt: new Date().toISOString(),
  };
   
  await updateDoc(ref, {
    [`moduleProgress.${moduleId}.steps.${stepId}`]: stepData,
    updatedAt: new Date().toISOString(),
  } as any);
};
