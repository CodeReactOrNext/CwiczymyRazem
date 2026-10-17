import { collection, documentId, query, where } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

export interface RecordingLiker {
  id: string;
  displayName: string | null;
}

/** Firestore's `in` operator takes at most 10 values per query. */
const IN_QUERY_LIMIT = 10;

/**
 * Names for the accounts that liked a recording. A recording only stores the ids
 * (`likes: string[]`), so the names are read from the user documents — on demand,
 * when somebody actually hovers the counter, never with the recordings list.
 *
 * Comes back in the order of `userIds`. Accounts that no longer exist are left
 * out rather than shown as blanks.
 */
export const getRecordingLikers = async (userIds: string[]): Promise<RecordingLiker[]> => {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += IN_QUERY_LIMIT) {
    chunks.push(uniqueIds.slice(i, i + IN_QUERY_LIMIT));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      trackedGetDocs(query(collection(db, "users"), where(documentId(), "in", chunk))),
    ),
  );

  const names = new Map<string, string | null>();
  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((userDoc) => {
      names.set(userDoc.id, userDoc.data().displayName || null);
    });
  });

  return uniqueIds
    .filter((id) => names.has(id))
    .map((id) => ({ id, displayName: names.get(id) ?? null }));
};
