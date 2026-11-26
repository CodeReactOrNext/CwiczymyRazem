import { calculateGroupFame } from "feature/logs/utils/activityFame";
import { getGroupReactionAnchor } from "feature/logs/utils/groupReactions";
import {
  decidePickThrow,
  PICK_THROWER_FAME,
  picksLeftToday,
  type PickThrowerRecord,
  type PickThrowResponse,
} from "feature/picks/picks.rules";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { loadTargetGroup, type StoredLog } from "lib/logs/loadLogGroup";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Tosses one pick at another player's activity. It is a Motivate on that row — the same group
 * rebuilt the same way as `/api/logs/react`, the same Fame, the same once-per-player check — paid
 * for from the thrower's daily allowance, and the player learns about it from a "pick"
 * notification. A row the thrower already motivated costs no pick.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { idToken, logId } = req.body as { idToken?: string; logId?: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!logId || typeof logId !== "string")
    return res.status(400).json({ error: "Missing logId" });

  let throwerId: string;
  try {
    throwerId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const targetSnapshot = await firestore.collection("logs").doc(logId).get();
    if (!targetSnapshot.exists)
      return res.status(404).json({ error: "LOG_NOT_FOUND" });

    const target = {
      ...targetSnapshot.data(),
      id: targetSnapshot.id,
    } as StoredLog;
    const recipientId = target.uid;
    if (!recipientId) return res.status(400).json({ error: "NOT_MOTIVATABLE" });
    if (recipientId === throwerId)
      return res.status(400).json({ error: "SELF" });

    const groupLogs = await loadTargetGroup(target);
    const anchor = getGroupReactionAnchor({ logs: groupLogs });
    const anchorId = (anchor ?? target).id as string;
    const groupFame = calculateGroupFame({ logs: groupLogs });

    const logRef = firestore
      .collection("logs")
      .doc(anchorId) as DocumentReference;
    const limitRef = firestore
      .collection("pickThrowers")
      .doc(throwerId) as DocumentReference;
    const recipientRef = firestore
      .collection("users")
      .doc(recipientId) as DocumentReference;
    const throwerRef = firestore
      .collection("users")
      .doc(throwerId) as DocumentReference;

    const result = await firestore.runTransaction(
      async (t: Transaction): Promise<PickThrowResponse> => {
        const [logDoc, limitDoc, recipientDoc, throwerDoc] = await Promise.all([
          t.get(logRef),
          t.get(limitRef),
          t.get(recipientRef),
          t.get(throwerRef),
        ]);
        if (!logDoc.exists) throw new Error("LOG_NOT_FOUND");
        if (!recipientDoc.exists || !throwerDoc.exists)
          throw new Error("USER_NOT_FOUND");

        const nowMs = Date.now();
        const limitRecord = limitDoc.exists
          ? (limitDoc.data() as PickThrowerRecord)
          : null;

        // Read inside the transaction, across the whole group: a reaction on any member means this
        // player has already motivated the row, through the feed or an earlier pick.
        const alreadyMotivated =
          groupLogs.some(
            (log) =>
              log.id !== anchorId && (log.reactions ?? []).includes(throwerId),
          ) ||
          ((logDoc.data() as StoredLog).reactions ?? []).includes(throwerId);
        if (alreadyMotivated) {
          return {
            thrown: false,
            alreadyMotivated: true,
            fameAwarded: 0,
            throwerFame: 0,
            picksLeft: picksLeftToday(limitRecord, nowMs),
          };
        }

        const decision = decidePickThrow(limitRecord, nowMs);
        if (!decision.ok) throw new Error(decision.reason);

        t.set(limitRef, decision.record);
        t.update(logRef, {
          reactions: FieldValue.arrayUnion(throwerId),
          [`reactionFame.${throwerId}`]: groupFame,
        });
        t.update(recipientRef, {
          "statistics.fame": FieldValue.increment(groupFame),
        });
        t.update(throwerRef, {
          "statistics.fame": FieldValue.increment(PICK_THROWER_FAME),
        });

        const thrower = throwerDoc.data() ?? {};
        t.set(firestore.collection("notifications").doc(), {
          userId: recipientId,
          senderId: throwerId,
          senderName: thrower.displayName || "Someone",
          senderAvatarUrl: thrower.avatar || thrower.photoURL || null,
          senderFrame: thrower.statistics?.lvl ?? 0,
          type: "pick",
          fameAwarded: groupFame,
          recordingId: anchorId,
          exerciseTitle:
            (target as { exerciseTitle?: string }).exerciseTitle ?? null,
          isRead: false,
          timestamp: FieldValue.serverTimestamp(),
        });

        return {
          thrown: true,
          alreadyMotivated: false,
          fameAwarded: groupFame,
          throwerFame: PICK_THROWER_FAME,
          picksLeft: decision.picksLeft,
        };
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    switch (code) {
      case "LOG_NOT_FOUND":
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: code });
      case "DAILY_LIMIT":
        return res.status(429).json({ error: "DAILY_LIMIT" });
      default:
        console.error("[picks/throw]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
