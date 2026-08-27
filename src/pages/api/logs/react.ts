import { calculateGroupFame } from "feature/logs/utils/activityFame";
import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import { groupConsecutiveLogs } from "feature/logs/utils/groupConsecutiveLogs";
import { getGroupReactionAnchor } from "feature/logs/utils/groupReactions";
import type {
  DocumentReference,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

type StoredLog = AnyFirebaseLog & {
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
 */
const GROUP_NEIGHBOUR_LIMIT = 50;

/** Mirrors Firestore's ordering for `orderBy("timestamp", "desc")`, including the __name__ tiebreak. */
const byFeedOrder = (a: StoredLog, b: StoredLog): number => {
  const left = String(a.timestamp ?? "");
  const right = String(b.timestamp ?? "");
  if (left !== right) return left < right ? 1 : -1;

  return a.id < b.id ? 1 : -1;
};

const toStoredLog = (doc: QueryDocumentSnapshot): StoredLog =>
  ({ ...doc.data(), id: doc.id }) as StoredLog;

/**
 * Rebuilds the contiguous slice of the feed around `target` and returns the group the target
 * belongs to — the same grouping the client renders, recomputed from trusted data.
 */
const loadTargetGroup = async (target: StoredLog): Promise<StoredLog[]> => {
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
  for (const doc of [...newer.docs, ...older.docs]) byId.set(doc.id, toStoredLog(doc));
  byId.set(target.id, target);

  const window = [...byId.values()].sort(byFeedOrder);
  const group = groupConsecutiveLogs(window).find((candidate) =>
    candidate.logs.some((log) => (log as StoredLog).id === target.id)
  );

  return (group?.logs as StoredLog[]) ?? [target];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, logId } = req.body as { idToken?: string; logId?: string };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!logId) return res.status(400).json({ error: "Missing logId" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const targetSnapshot = await firestore.collection("logs").doc(logId).get();
    if (!targetSnapshot.exists) return res.status(404).json({ error: "Log not found" });

    const target = { ...targetSnapshot.data(), id: targetSnapshot.id } as StoredLog;
    const recipientId = target.uid;
    if (!recipientId) return res.status(400).json({ error: "This activity cannot be motivated" });
    if (recipientId === userId) {
      return res.status(400).json({ error: "You cannot motivate your own activity" });
    }

    const groupLogs = await loadTargetGroup(target);

    // Whether this user already reacted — and if so, on which member — is decided here rather than
    // taken from the request, so a stale client can't double-award or double-refund.
    const reactedLog = groupLogs.find((log) => (log.reactions ?? []).includes(userId));
    const anchor = getGroupReactionAnchor({ logs: groupLogs });
    const targetLogId = (reactedLog ?? anchor ?? target).id as string;

    const isRemoving = Boolean(reactedLog);
    const groupFame = calculateGroupFame({ logs: groupLogs });

    const logRef = firestore.collection("logs").doc(targetLogId) as DocumentReference;
    const recipientRef = firestore.collection("users").doc(recipientId) as DocumentReference;
    const reactorRef = firestore.collection("users").doc(userId) as DocumentReference;

    const fameAwarded = await firestore.runTransaction(async (t: Transaction) => {
      const [logDoc, recipientDoc, reactorDoc] = await Promise.all([
        t.get(logRef),
        t.get(recipientRef),
        t.get(reactorRef),
      ]);
      if (!logDoc.exists) throw new Error("LOG_NOT_FOUND");
      if (!recipientDoc.exists || !reactorDoc.exists) throw new Error("USER_NOT_FOUND");

      const logData = logDoc.data() as StoredLog;
      const alreadyReacted = (logData.reactions ?? []).includes(userId);

      // The read inside the transaction is the authority: if it disagrees with what we saw a
      // moment ago, a concurrent request already applied this toggle.
      if (alreadyReacted !== isRemoving) throw new Error("RACED");

      if (isRemoving) {
        // Refund exactly what was granted. Reactions from before per-reactor amounts were recorded
        // have no entry, so they fall back to the row's current payout — best effort on old data.
        const granted = logData.reactionFame?.[userId] ?? groupFame;

        t.update(logRef, {
          reactions: FieldValue.arrayRemove(userId),
          [`reactionFame.${userId}`]: FieldValue.delete(),
        });
        t.update(recipientRef, { "statistics.fame": FieldValue.increment(-granted) });
        t.update(reactorRef, { "statistics.fame": FieldValue.increment(-1) });

        return -granted;
      }

      t.update(logRef, {
        reactions: FieldValue.arrayUnion(userId),
        [`reactionFame.${userId}`]: groupFame,
      });
      t.update(recipientRef, { "statistics.fame": FieldValue.increment(groupFame) });
      t.update(reactorRef, { "statistics.fame": FieldValue.increment(1) });

      const reactorData = reactorDoc.data() ?? {};
      t.set(firestore.collection("notifications").doc(), {
        userId: recipientId,
        senderId: userId,
        senderName: reactorData.displayName || "Someone",
        senderAvatarUrl: reactorData.avatar || reactorData.photoURL || null,
        senderFrame: reactorData.statistics?.lvl ?? 0,
        type: "reaction",
        fameAwarded: groupFame,
        recordingId: targetLogId,
        recordingTitle: "",
        isRead: false,
        timestamp: FieldValue.serverTimestamp(),
      });

      return groupFame;
    });

    return res.status(200).json({ reacted: !isRemoving, fameAwarded, logId: targetLogId });
  } catch (error: any) {
    switch (error?.message) {
      case "LOG_NOT_FOUND":
        return res.status(404).json({ error: "Log not found" });
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "User not found" });
      case "RACED":
        return res.status(409).json({ error: "Reaction already updated" });
      default:
        console.error("[logs/react]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
