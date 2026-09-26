import type { SongArrangement, SongPart } from "feature/songs/types/songs.type";
import {
  type ArrangementProgressMap,
  parseArrangement,
  toArrangementProgressMap,
} from "feature/songs/utils/arrangements.utils";
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
  /** Parts of the song the user marked as playable (riff / solo / whole song). */
  parts: SongPart[];
  /**
   * Per-arrangement slice of the figures above (lead / rhythm / bass). Time
   * logged without an arrangement only lands in the song-level totals, so the
   * totals are always ≥ the sum of these.
   */
  arrangements: ArrangementProgressMap;
  /** The arrangement practised last — preselected next time. */
  lastArrangement: SongArrangement | null;
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
  parts: data.parts ?? [],
  arrangements: toArrangementProgressMap(data.arrangements),
  lastArrangement: parseArrangement(data.lastArrangement) ?? null,
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

export const updateSongParts = async (
  userId: string,
  songId: string,
  parts: SongPart[]
): Promise<void> => {
  await setDoc(
    progressRef(userId, songId),
    { songId, parts, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

/** "I can play this" marks of a single arrangement — the song-level marks stay untouched. */
export const updateArrangementParts = async (
  userId: string,
  songId: string,
  arrangement: SongArrangement,
  parts: SongPart[]
): Promise<void> => {
  await setDoc(
    progressRef(userId, songId),
    { songId, arrangements: { [arrangement]: { parts } }, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

export const recordPracticeSession = async (
  userId: string,
  songId: string,
  sessionMs: number,
  accuracy: number | null,
  currentBestAccuracy: number | null,
  arrangement?: SongArrangement
): Promise<void> => {
  const updates: Record<string, any> = {
    songId,
    totalPracticeMs: increment(sessionMs),
    sessionCount: increment(1),
    lastPracticedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // The arrangement gets its own slice on top of the song totals. Increments
  // only — merge deep-merges the nested map, so the other arrangements and
  // this one's part marks survive.
  if (arrangement) {
    updates.lastArrangement = arrangement;
    updates.arrangements = {
      [arrangement]: {
        totalPracticeMs: increment(sessionMs),
        sessionCount: increment(1),
        lastPracticedAt: serverTimestamp(),
      },
    };
  }

  if (accuracy !== null) {
    updates.lastAccuracy = accuracy;
    if (currentBestAccuracy === null || accuracy > currentBestAccuracy) {
      updates.bestAccuracy = accuracy;
    }
  }

  await setDoc(progressRef(userId, songId), updates, { merge: true });
};
