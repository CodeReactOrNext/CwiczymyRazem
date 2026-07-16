import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

// ⚠️ Server-only. Imports firebase-admin, so it must never reach the client
// bundle — only the community-exercise API routes import it (by full path, and
// this folder has no barrel re-export). The `.server.ts` suffix marks that.

type ExerciseNotificationType = "exercise_thanked" | "exercise_completed";

interface NotifyExerciseAuthorParams {
  type: ExerciseNotificationType;
  /** Recipient — the exercise's author. */
  authorId: string;
  /** The user who thanked or completed the exercise. */
  senderId: string;
  exerciseId: string;
  exerciseTitle: string;
  fameAwarded: number;
}

/**
 * Tells a community-exercise author that someone thanked or completed their
 * exercise, mirroring the fame they were just awarded so the reward is visible
 * instead of silently accruing.
 *
 * Fire-and-forget: any failure is logged, never thrown, so it can't break the
 * reward transaction that already committed. Written with the Admin SDK, which
 * bypasses firestore.rules (the notifications doc shape matches marketplace_sold).
 */
export async function notifyExerciseAuthor({
  type,
  authorId,
  senderId,
  exerciseId,
  exerciseTitle,
  fameAwarded,
}: NotifyExerciseAuthorParams): Promise<void> {
  // Never notify someone about their own action (the endpoints already block
  // self-thank/self-completion rewards, but guard here too).
  if (!authorId || authorId === senderId) return;

  try {
    const senderDoc = await firestore.collection("users").doc(senderId).get();
    const sender = senderDoc.data() ?? {};

    await firestore.collection("notifications").add({
      userId: authorId,
      type,
      senderId,
      senderName: sender.displayName || "Someone",
      senderAvatarUrl: sender.avatar || sender.photoURL || null,
      senderFrame: sender.statistics?.lvl ?? 0,
      exerciseId,
      exerciseTitle,
      fameAwarded,
      isRead: false,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // A missing notification must not fail the reward that already happened.
    console.error("[notifyExerciseAuthor]", error);
  }
}
