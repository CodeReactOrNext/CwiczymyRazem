import type {
  LiveMotivateResponse,
  LiveSenderRecord,
  LiveSessionRecord,
} from "feature/liveMotivate/liveMotivate.rules";
import {
  decideLiveMotivate,
  LIVE_MOTIVATE_SENDER_FAME,
  liveSessionKey,
} from "feature/liveMotivate/liveMotivate.rules";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import type { CurrentActivityInterface } from "types/api.types";
import { auth, database, firestore } from "utils/firebase/api/firebase.config";

interface PresenceEntry {
  state?: string;
  currentActivity?: CurrentActivityInterface | null;
}

/**
 * Motivates a player while they are practicing. The server checks their presence, so only a
 * session that is running right now can be motivated, and prices it with `decideLiveMotivate`
 * inside one transaction: once per motivator per session, a cap per session and per sender day,
 * and the Hype bonus. The player learns about it from the notification, which their session
 * listens for.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { idToken, recipientId } = req.body as { idToken?: string; recipientId?: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!recipientId || typeof recipientId !== "string") {
    return res.status(400).json({ error: "Missing recipientId" });
  }

  let senderId: string;
  try {
    senderId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (senderId === recipientId) {
    return res.status(400).json({ error: "SELF" });
  }

  try {
    const presence = (await database.ref(`status/${recipientId}`).once("value")).val() as PresenceEntry | null;
    const activity = presence?.state === "online" ? presence.currentActivity : null;
    if (!activity || typeof activity.timestamp !== "number") {
      return res.status(409).json({ error: "NOT_PLAYING" });
    }

    const sessionKey = liveSessionKey(activity);
    const sessionRef = firestore
      .collection("liveMotivations")
      .doc(`${recipientId}_${sessionKey}`) as DocumentReference;
    const senderLimitRef = firestore.collection("liveMotivationSenders").doc(senderId) as DocumentReference;
    const recipientRef = firestore.collection("users").doc(recipientId) as DocumentReference;
    const senderRef = firestore.collection("users").doc(senderId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction): Promise<LiveMotivateResponse> => {
      const [sessionDoc, senderLimitDoc, recipientDoc, senderDoc] = await Promise.all([
        t.get(sessionRef),
        t.get(senderLimitRef),
        t.get(recipientRef),
        t.get(senderRef),
      ]);
      if (!recipientDoc.exists || !senderDoc.exists) throw new Error("USER_NOT_FOUND");

      const nowMs = Date.now();
      const decision = decideLiveMotivate({
        senderId,
        recipientId,
        nowMs,
        session: sessionDoc.exists ? (sessionDoc.data() as LiveSessionRecord) : null,
        sender: senderLimitDoc.exists ? (senderLimitDoc.data() as LiveSenderRecord) : null,
      });

      if (!decision.ok) {
        if (decision.reason === "ALREADY") {
          return { fameAwarded: 0, senderFame: 0, hype: false, alreadyMotivated: true };
        }
        throw new Error(decision.reason);
      }

      t.set(sessionRef, {
        ...decision.session,
        recipientId,
        sessionKey,
        updatedAt: FieldValue.serverTimestamp(),
      });
      t.set(senderLimitRef, decision.sender);
      t.update(recipientRef, { "statistics.fame": FieldValue.increment(decision.recipientFame) });
      t.update(senderRef, { "statistics.fame": FieldValue.increment(LIVE_MOTIVATE_SENDER_FAME) });

      const sender = senderDoc.data() ?? {};
      t.set(firestore.collection("notifications").doc(), {
        userId: recipientId,
        senderId,
        senderName: sender.displayName || "Someone",
        senderAvatarUrl: sender.avatar || sender.photoURL || null,
        senderFrame: sender.statistics?.lvl ?? 0,
        type: "live_motivate",
        fameAwarded: decision.recipientFame,
        hype: decision.hype,
        hypeCount: decision.hypeCount,
        isRead: false,
        timestamp: FieldValue.serverTimestamp(),
      });

      return {
        fameAwarded: decision.recipientFame,
        senderFame: LIVE_MOTIVATE_SENDER_FAME,
        hype: decision.hype,
        alreadyMotivated: false,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    switch (error?.message) {
      case "USER_NOT_FOUND":
        return res.status(404).json({ error: "USER_NOT_FOUND" });
      case "SESSION_FULL":
        return res.status(409).json({ error: "SESSION_FULL" });
      case "DAILY_LIMIT":
        return res.status(429).json({ error: "DAILY_LIMIT" });
      default:
        console.error("[presence/motivate]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
