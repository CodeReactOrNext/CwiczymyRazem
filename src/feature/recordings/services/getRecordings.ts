import type { Recording } from "feature/recordings/types/types";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc, trackedGetDocs } from "utils/firebase/client/firestoreTracking";

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
    recordings,
    total,
    lastDoc,
  };
};

export const getRecordingById = async (recordingId: string): Promise<Recording | null> => {
  try {
    const docRef = doc(db, "recordings", recordingId);
    const docSnap = await trackedGetDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Recording;
    }
    return null;
  } catch (error) {
    console.error("Error fetching recording by ID:", error);
    return null;
  }
};
