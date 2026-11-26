import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import { groupConsecutiveLogs } from "feature/logs/utils/groupConsecutiveLogs";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

export type StoredLog = AnyFirebaseLog & {
  id: string;
  uid?: string;
  reactions?: string[];
  reactionFame?: Record<string, number>;
};

/**
 * How many neighbours on each side of the target log get pulled in to rebuild its feed group.
 * Grouping only ever depends on immediate neighbours, so a slice this wide reproduces exactly what
 * the feed rendered unless a single group runs longer than the slice — in which case the server
 * simply pays out for the part it can see.
 *
 * Kept deliberately small: these two queries are the single largest source of Firestore reads in
 * the project (measured 2026-09: ~1.27M reads/month, two thirds of the whole database), because
 * every click on "Motivate" pays for the full slice on both sides. A group is a handful of
 * consecutive logs by one user, so eight covers every real case and the longer-than-the-slice
 * fallback above handles the rest.
 */
const GROUP_NEIGHBOUR_LIMIT = 8;

/** Mirrors Firestore's ordering for `orderBy("timestamp", "desc")`, including the __name__ tiebreak. */
export const byFeedOrder = (a: StoredLog, b: StoredLog): number => {
  const left = String(a.timestamp ?? "");
  const right = String(b.timestamp ?? "");
  if (left !== right) return left < right ? 1 : -1;

  return a.id < b.id ? 1 : -1;
};

export const toStoredLog = (doc: QueryDocumentSnapshot): StoredLog =>
  ({ ...doc.data(), id: doc.id }) as StoredLog;

/**
 * Rebuilds the contiguous slice of the feed around `target` and returns the group the target
 * belongs to — the same grouping the client renders, recomputed from trusted data.
 */
export const loadTargetGroup = async (
  target: StoredLog,
): Promise<StoredLog[]> => {
  const logs = firestore.collection("logs");
  const [newer, older] = await Promise.all([
    logs
      .where("timestamp", ">=", target.timestamp)
      .orderBy("timestamp", "asc")
      .limit(GROUP_NEIGHBOUR_LIMIT)
      .get(),
    logs
      .where("timestamp", "<=", target.timestamp)
      .orderBy("timestamp", "desc")
      .limit(GROUP_NEIGHBOUR_LIMIT)
      .get(),
  ]);

  const byId = new Map<string, StoredLog>();
  for (const doc of [...newer.docs, ...older.docs])
    byId.set(doc.id, toStoredLog(doc));
  byId.set(target.id, target);

  const window = [...byId.values()].sort(byFeedOrder);
  const group = groupConsecutiveLogs(window).find((candidate) =>
    candidate.logs.some((log) => (log as StoredLog).id === target.id),
  );

  return (group?.logs as StoredLog[]) ?? [target];
};
