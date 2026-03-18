import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export interface UserSongProgress {
  songId: string;
  gpFileId: string | null;
  gpFileName: string | null;
  selectedTrackIndex: number;
  totalPracticeMs: number;
  lastPracticedAt: Date | null;
  bestAccuracy: number | null;
  lastAccuracy: number | null;
  sessionCount: number;
  updatedAt: Date;
}

const progressRef = (userId: string, songId: string) =>
  doc(db, "users", userId, "songProgress", songId);

const toProgress = (songId: string, data: Record<string, any>): UserSongProgress => ({
  songId,
  gpFileId: data.gpFileId ?? null,
  gpFileName: data.gpFileName ?? null,
  selectedTrackIndex: data.selectedTrackIndex ?? 0,
  totalPracticeMs: data.totalPracticeMs ?? 0,
  lastPracticedAt: data.lastPracticedAt?.toDate?.() ?? null,
  bestAccuracy: data.bestAccuracy ?? null,
  lastAccuracy: data.lastAccuracy ?? null,
  sessionCount: data.sessionCount ?? 0,
  updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
});

export const getUserSongProgress = async (
  userId: string,
  songId: string
): Promise<UserSongProgress | null> => {
  const snap = await getDoc(progressRef(userId, songId));
  if (!snap.exists()) return null;
  return toProgress(songId, snap.data());
};

export const getAllUserSongProgress = async (
  userId: string
): Promise<UserSongProgress[]> => {
  const snap = await getDocs(collection(db, "users", userId, "songProgress"));
  return snap.docs.map((d) => toProgress(d.id, d.data()));
};

export const attachGpFileToSong = async (
  userId: string,
  songId: string,
  gpFileId: string,
  gpFileName: string,
  selectedTrackIndex = 0
): Promise<void> => {
  await setDoc(
    progressRef(userId, songId),
    { songId, gpFileId, gpFileName, selectedTrackIndex, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

export const detachGpFileFromSong = async (
  userId: string,
  songId: string
): Promise<void> => {
  await updateDoc(progressRef(userId, songId), {
    gpFileId: null,
    gpFileName: null,
    selectedTrackIndex: 0,
    updatedAt: serverTimestamp(),
  });
};

export const recordPracticeSession = async (
  userId: string,
  songId: string,
  sessionMs: number,
  accuracy: number | null,
  currentBestAccuracy: number | null
): Promise<void> => {
  const updates: Record<string, any> = {
    songId,
    totalPracticeMs: increment(sessionMs),
    sessionCount: increment(1),
    lastPracticedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (accuracy !== null) {
    updates.lastAccuracy = accuracy;
    if (currentBestAccuracy === null || accuracy > currentBestAccuracy) {
      updates.bestAccuracy = accuracy;
    }
  }

  await setDoc(progressRef(userId, songId), updates, { merge: true });
};
