import type { DailyExerciseEntry, DailyExerciseSubmission } from "feature/dailyExercise/types/dailyExercise.types";
import { findDailyDayKeyFor } from "feature/dailyExercise/utils/dailyExercise";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Banks a mic-scored run of the exercise of the day. Only the day's own
 * exercise counts (or yesterday's, for a session that ran over midnight UTC),
 * and only a player's best run stays on the board.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, dayKey, exerciseId, score, accuracy, bpm } = req.body as DailyExerciseSubmission & {
    idToken?: string;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (typeof exerciseId !== "string" || typeof dayKey !== "string") {
    return res.status(400).json({ error: "Missing exercise" });
  }
  if (!Number.isFinite(score) || score <= 0 || !Number.isFinite(accuracy)) {
    return res.status(400).json({ error: "Invalid score" });
  }
  if (findDailyDayKeyFor(exerciseId) !== dayKey) {
    return res.status(400).json({ error: "Not the exercise of the day" });
  }

  let userId: string;
  try {
    userId = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userDoc = await firestore.collection("users").doc(userId).get();
    const user = userDoc.data() ?? {};

    const boardRef: DocumentReference = firestore.collection("dailyExerciseLeaderboards").doc(dayKey);
    const entryRef: DocumentReference = boardRef.collection("entries").doc(userId);

    const isNewBest = await firestore.runTransaction(async (tx: Transaction) => {
      const existing = await tx.get(entryRef);
      if (existing.exists && (existing.data()?.score ?? 0) >= score) return false;

      const entry: DailyExerciseEntry = {
        userId,
        displayName: user.displayName || "Anonymous",
        avatar: user.avatar || "",
        lvl: user.statistics?.lvl ?? 1,
        score: Math.round(score),
        accuracy: Math.max(0, Math.min(100, Math.round(accuracy))),
        ...(Number.isFinite(bpm) ? { bpm: Math.round(bpm!) } : {}),
        updatedAt: Date.now(),
      };
      tx.set(boardRef, { exerciseId }, { merge: true });
      tx.set(entryRef, entry);
      return true;
    });

    return res.status(200).json({ isNewBest });
  } catch (error) {
    console.error("daily-exercise/submit failed", error);
    return res.status(500).json({ error: "Could not save the score" });
  }
}
