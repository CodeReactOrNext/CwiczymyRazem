import { notifyExerciseAuthor } from "feature/communityExercises/services/authorNotification.server";
import { THANKS_FAME_REWARD } from "feature/communityExercises/types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

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
    const thanksRef = exerciseRef
      .collection("thanks")
      .doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const exerciseDoc = await t.get(exerciseRef);
      if (!exerciseDoc.exists) throw new Error("EXERCISE_NOT_FOUND");
      const exercise = exerciseDoc.data()!;

      if (exercise.authorId === userId) throw new Error("OWN_EXERCISE");

      const thanksDoc = await t.get(thanksRef);
      if (thanksDoc.exists) throw new Error("ALREADY_THANKED");

      const authorRef = firestore
        .collection("users")
        .doc(exercise.authorId) as DocumentReference;
      const authorDoc = await t.get(authorRef);
      if (!authorDoc.exists) throw new Error("AUTHOR_NOT_FOUND");

      t.set(thanksRef, { createdAt: FieldValue.serverTimestamp() });
      t.update(exerciseRef, { thanksCount: FieldValue.increment(1) });
      t.update(authorRef, {
        "statistics.fame": FieldValue.increment(THANKS_FAME_REWARD),
      });

      return {
        authorId: exercise.authorId as string,
        exerciseTitle: (exercise.title as string) ?? "",
      };
    });

    // Let the author know someone thanked them (fire-and-forget — never blocks
    // the response, since the fame was already awarded above).
    await notifyExerciseAuthor({
      type: "exercise_thanked",
      authorId: result.authorId,
      senderId: userId,
      exerciseId,
      exerciseTitle: result.exerciseTitle,
      fameAwarded: THANKS_FAME_REWARD,
    });

    return res
      .status(200)
      .json({ success: true, fameAwarded: THANKS_FAME_REWARD });
  } catch (error: any) {
    switch (error.message) {
      case "EXERCISE_NOT_FOUND":
        return res.status(404).json({ error: "Exercise not found" });
      case "OWN_EXERCISE":
        return res
          .status(400)
          .json({ error: "You cannot thank your own exercise" });
      case "ALREADY_THANKED":
        return res
          .status(409)
          .json({ error: "You already thanked this exercise" });
      case "AUTHOR_NOT_FOUND":
        return res.status(404).json({ error: "Author not found" });
      default:
        console.error("[community-exercises/thank]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
