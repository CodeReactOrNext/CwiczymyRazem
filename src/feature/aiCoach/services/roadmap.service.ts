import { db } from "utils/firebase/client/firebase.utils";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { Roadmap } from "../types/roadmap.types";

const ROADMAPS_COLLECTION = "roadmaps";

export const firebaseSaveRoadmap = async (roadmap: Roadmap) => {
  const roadmapRef = doc(db, ROADMAPS_COLLECTION, roadmap.id);
  await setDoc(roadmapRef, roadmap);
};

export const firebaseGetUserRoadmaps = async (userId: string): Promise<Roadmap[]> => {
  const roadmapsRef = collection(db, ROADMAPS_COLLECTION);
  const q = query(roadmapsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  const roadmaps: Roadmap[] = [];
  querySnapshot.forEach((doc) => {
    roadmaps.push(doc.data() as Roadmap);
  });

  return roadmaps.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const firebaseUpdateRoadmap = async (roadmapId: string, data: Partial<Roadmap>) => {
  const roadmapRef = doc(db, ROADMAPS_COLLECTION, roadmapId);
  await updateDoc(roadmapRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const firebaseDeleteRoadmap = async (roadmapId: string) => {
  const roadmapRef = doc(db, ROADMAPS_COLLECTION, roadmapId);
  await deleteDoc(roadmapRef);
};
