import { notifyExerciseAuthor } from "feature/communityExercises/services/authorNotification.server";
import { COMPLETION_FAME_REWARD } from "feature/communityExercises/types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Records that a user has finished practicing a community exercise. The
 * author is rewarded a small amount of fame the first time a given user
 * completes their exercise (deduplicated via the `completions` subcollection)
 * — real usage earns fame, not just publishing. Self-completions (author
 * practicing their own exercise) are recorded as a no-op so they never farm
 * fame from their own content.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, exerciseId } = req.body as {
    idToken: string;
    exerciseId: string;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!exerciseId) return res.status(400).json({ error: "Missing exerciseId" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const exerciseRef = firestore
      .collection("communityExercises")
      .doc(exerciseId) as DocumentReference;
    const completionRef = exerciseRef
      .collection("completions")
      .doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const exerciseDoc = await t.get(exerciseRef);
      if (!exerciseDoc.exists) throw new Error("EXERCISE_NOT_FOUND");
      const exercise = exerciseDoc.data()!;

      const completionDoc = await t.get(completionRef);
      if (completionDoc.exists) return { rewarded: false as const }; // already counted, not an error

      if (exercise.authorId === userId) {
        // Still record it so repeated self-practice doesn't retry every time,
        // but never reward the author for practicing their own exercise.
        t.set(completionRef, { createdAt: FieldValue.serverTimestamp() });
        return { rewarded: false as const };
      }

      const authorRef = firestore
        .collection("users")
        .doc(exercise.authorId) as DocumentReference;
      const authorDoc = await t.get(authorRef);
      if (!authorDoc.exists) throw new Error("AUTHOR_NOT_FOUND");

      t.set(completionRef, { createdAt: FieldValue.serverTimestamp() });
      t.update(authorRef, {
        "statistics.fame": FieldValue.increment(COMPLETION_FAME_REWARD),
      });
      return {
        rewarded: true as const,
        authorId: exercise.authorId as string,
        exerciseTitle: (exercise.title as string) ?? "",
      };
    });

    // Notify the author only on the first completion by this user (i.e. when
    // fame was actually awarded), so repeat practice doesn't spam them.
    if (result.rewarded) {
      await notifyExerciseAuthor({
        type: "exercise_completed",
        authorId: result.authorId,
        senderId: userId,
        exerciseId,
        exerciseTitle: result.exerciseTitle,
        fameAwarded: COMPLETION_FAME_REWARD,
      });
    }

    return res.status(200).json({
      success: true,
      rewarded: result.rewarded,
      fameAwarded: result.rewarded ? COMPLETION_FAME_REWARD : 0,
    });
  } catch (error: any) {
    switch (error.message) {
      case "EXERCISE_NOT_FOUND":
        return res.status(404).json({ error: "Exercise not found" });
      case "AUTHOR_NOT_FOUND":
        return res.status(404).json({ error: "Author not found" });
      default:
        console.error("[community-exercises/complete]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
