import { calculateGroupFame } from "feature/logs/utils/activityFame";
import { getGroupReactionAnchor } from "feature/logs/utils/groupReactions";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { loadTargetGroup, type StoredLog } from "lib/logs/loadLogGroup";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

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
    // taken from the request, so a stale client can't double-award. Motivating is one-way: a
    // reaction can't be taken back, so a repeat click is a no-op that reports the existing state.
    const reactedLog = groupLogs.find((log) => (log.reactions ?? []).includes(userId));
    if (reactedLog) {
      return res.status(200).json({ reacted: true, fameAwarded: 0, logId: reactedLog.id });
    }

    const anchor = getGroupReactionAnchor({ logs: groupLogs });
    const targetLogId = (anchor ?? target).id as string;

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

      // The read inside the transaction is the authority: if a concurrent request already
      // reacted, this one must not pay out a second time.
      if ((logData.reactions ?? []).includes(userId)) throw new Error("RACED");

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

    return res.status(200).json({ reacted: true, fameAwarded, logId: targetLogId });
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
