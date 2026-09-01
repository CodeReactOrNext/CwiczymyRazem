import type { Recording } from "feature/recordings/types/types";
import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc, trackedGetDocs } from "utils/firebase/client/firestoreTracking";

/**
 * Recordings denormalise the author's avatar at write time, but everything saved
 * before that field was fixed has `userAvatarUrl: null` (it used to be read from
 * a non-existent `photoURL`). Fill those in from the user docs so old recordings
 * show an avatar too; recordings that already carry one cost no extra reads.
 */
const withAuthorAvatars = async (recordings: Recording[]) => {
  const missingIds = [
    ...new Set(
      recordings.filter((r) => !r.userAvatarUrl && r.userId).map((r) => r.userId),
    ),
  ];

  if (missingIds.length === 0) return recordings;

  const chunks: string[][] = [];
  for (let i = 0; i < missingIds.length; i += 10) {
    chunks.push(missingIds.slice(i, i + 10));
  }

  type AuthorProfile = {
    avatar: string | null;
    lvl: number;
    displayName: string | null;
  };
  const authors = new Map<string, AuthorProfile>();

  try {
    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        trackedGetDocs(query(collection(db, "users"), where(documentId(), "in", chunk))),
      ),
    );

    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((userDoc) => {
        const data = userDoc.data();
        authors.set(userDoc.id, {
          avatar: data.avatar || null,
          lvl: data.statistics?.lvl ?? 0,
          displayName: data.displayName || null,
        });
      });
    });
  } catch (error) {
    console.error("Error hydrating recording authors:", error);
    return recordings;
  }

  return recordings.map((recording) => {
    const author = authors.get(recording.userId);
    if (!author) return recording;

    return {
      ...recording,
      userAvatarUrl: recording.userAvatarUrl || author.avatar,
      userAvatarFrame: recording.userAvatarFrame ?? author.lvl,
      userDisplayName: recording.userDisplayName || author.displayName,
    };
  });
};

export const getRecordings = async (
  page: number,
  itemsPerPage: number,
  userId?: string, // Filter by user
  songId?: string, // Filter by song
  afterDoc?: any
) => {
  const recordingsRef = collection(db, "recordings");
  let baseQuery = query(recordingsRef);

  if (userId) {
    baseQuery = query(baseQuery, where("userId", "==", userId));
  }

  if (songId) {
    baseQuery = query(baseQuery, where("songId", "==", songId));
  }

  // Get total count
  const countSnapshot = await getCountFromServer(baseQuery);
  const total = countSnapshot.data().count;

  // Pagination query
  let q = query(
    baseQuery,
    orderBy("createdAt", "desc"),
    limit(itemsPerPage)
  );

  if (afterDoc && page > 1) {
    q = query(baseQuery, orderBy("createdAt", "desc"), startAfter(afterDoc), limit(itemsPerPage));
  }

  let recordings: Recording[] = [];
  let lastDoc: any = null;

  try {
    const snapshot = await trackedGetDocs(q);
    recordings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Recording[];
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  } catch (error: any) {
    if (error?.code === "failed-precondition") {
      console.warn("Index missing for recordings query, falling back to simple query.");
      // Simple fallback without orderby
      const simpleQ = query(baseQuery, limit(itemsPerPage));
      const fallbackSnapshot = await trackedGetDocs(simpleQ);
      recordings = fallbackSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Recording[];
      // Sort locally
      recordings.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });
      lastDoc = fallbackSnapshot.docs[fallbackSnapshot.docs.length - 1];
    } else {
      throw error;
    }
  }

  return {
    recordings: await withAuthorAvatars(recordings),
    total,
    lastDoc,
  };
};

export const getRecordingById = async (recordingId: string): Promise<Recording | null> => {
  try {
    const docRef = doc(db, "recordings", recordingId);
    const docSnap = await trackedGetDoc(docRef);

    if (docSnap.exists()) {
      const recording = {
        id: docSnap.id,
        ...docSnap.data(),
      } as Recording;

      const [hydrated] = await withAuthorAvatars([recording]);
      return hydrated;
    }
    return null;
  } catch (error) {
    console.error("Error fetching recording by ID:", error);
    return null;
  }
};
