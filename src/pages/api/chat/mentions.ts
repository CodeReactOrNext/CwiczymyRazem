import { snippet } from "feature/chat/utils/chatMentions";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  chatNotificationRecipients,
  guildIdOfChatPath,
  isChatPath,
} from "lib/chat/chatMentionRecipients";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Notifies the people a chat message tagged or answered.
 *
 * The client only says which message it just posted. Who gets notified is read
 * off the stored message, only its author may ask, and the message is marked
 * so the same message can never ring anyone twice. In a guild room only
 * members hear about it — tagging an outsider there rings nobody.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, chatPath, messageId } = (req.body ?? {}) as {
    idToken?: string;
    chatPath?: unknown;
    messageId?: unknown;
  };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!isChatPath(chatPath) || typeof messageId !== "string" || !messageId) {
    return res.status(400).json({ error: "Missing message" });
  }

  let uid: string;
  try {
    uid = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const messageRef = firestore
      .collection(chatPath)
      .doc(messageId) as DocumentReference;

    const message = await firestore.runTransaction(async (tx: Transaction) => {
      const snap: DocumentSnapshot = await tx.get(messageRef);
      const data = snap.data();
      if (!snap.exists || !data) return "missing" as const;
      if (data.userId !== uid) return "not-yours" as const;
      if (data.mentionsNotified) return "done" as const;

      tx.update(messageRef, { mentionsNotified: true });
      return data;
    });

    if (message === "missing") {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message === "not-yours") {
      return res.status(403).json({ error: "Not your message" });
    }
    if (message === "done") return res.status(200).json({ notified: 0 });

    let recipients = chatNotificationRecipients(message);

    const guildId = guildIdOfChatPath(chatPath);
    if (guildId && recipients.length > 0) {
      const users: DocumentSnapshot[] = await firestore.getAll(
        ...recipients.map((recipient) =>
          firestore.collection("users").doc(recipient.uid),
        ),
      );
      const members = new Set(
        users
          .filter((user) => user.data()?.guildId === guildId)
          .map((user) => user.id),
      );
      recipients = recipients.filter((recipient) => members.has(recipient.uid));
    }

    if (recipients.length === 0) return res.status(200).json({ notified: 0 });

    const text =
      typeof message.message === "string" && message.message.trim()
        ? snippet(message.message)
        : "shared something";

    const batch = firestore.batch();
    for (const recipient of recipients) {
      batch.set(firestore.collection("notifications").doc(), {
        userId: recipient.uid,
        type: recipient.type,
        senderId: uid,
        senderName: message.username || "Someone",
        senderAvatarUrl: message.userPhotoURL ?? null,
        senderFrame: message.lvl ?? 0,
        chatPath,
        chatMessageId: messageId,
        messageSnippet: text,
        isRead: false,
        timestamp: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    return res.status(200).json({ notified: recipients.length });
  } catch (error) {
    console.error("[chat/mentions]", error);
    return res.status(500).json({ error: "Could not notify" });
  }
}
