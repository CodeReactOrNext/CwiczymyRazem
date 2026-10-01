import type { DailyExerciseEntry, DailyExerciseLeaderboard } from "feature/dailyExercise/types/dailyExercise.types";
import { DAILY_LEADERBOARD_SIZE, getDailyDayKey } from "feature/dailyExercise/utils/dailyExercise";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The top of one day's board, plus the asking player's own place. Scores are
 * public — the same names and numbers the board shows everyone — so the
 * player's id comes in as a plain query parameter.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const dayKey = typeof req.query.day === "string" && DAY_KEY.test(req.query.day)
    ? req.query.day
    : getDailyDayKey();
  const uid = typeof req.query.uid === "string" ? req.query.uid : null;

  try {
    const boardRef = firestore.collection("dailyExerciseLeaderboards").doc(dayKey);
    const entries = boardRef.collection("entries");

    const [boardDoc, topSnap, countSnap, ownDoc] = await Promise.all([
      boardRef.get(),
      entries.orderBy("score", "desc").limit(DAILY_LEADERBOARD_SIZE).get(),
      entries.count().get(),
      uid ? entries.doc(uid).get() : Promise.resolve(null),
    ]);

    const top: DailyExerciseEntry[] = topSnap.docs.map((doc: QueryDocumentSnapshot) => doc.data() as DailyExerciseEntry);

    let me: DailyExerciseLeaderboard["me"] = null;
    const own = ownDoc?.exists ? (ownDoc.data() as DailyExerciseEntry) : null;
    if (own) {
      const topIndex = top.findIndex((entry) => entry.userId === own.userId);
      const rank = topIndex >= 0
        ? topIndex + 1
        : (await entries.where("score", ">", own.score).count().get()).data().count + 1;
      me = { ...own, rank };
    }

    const body: DailyExerciseLeaderboard = {
      dayKey,
      exerciseId: boardDoc.data()?.exerciseId ?? null,
      top,
      me,
      players: countSnap.data().count,
    };
    return res.status(200).json(body);
  } catch (error) {
    console.error("daily-exercise/leaderboard failed", error);
    return res.status(500).json({ error: "Could not load the leaderboard" });
  }
}
