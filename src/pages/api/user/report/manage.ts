import { invalidateActivityLogsCache } from "feature/logs/services/getUserRaprotsLogs.service";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_TIME_MS = 24 * 60 * 60 * 1000;

const TIME_KEYS = [
  "techniqueTime",
  "theoryTime",
  "hearingTime",
  "creativityTime",
] as const;

const isValidTimeMs = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= MAX_TIME_MS;

// Reports written before the `seasonId` field existed don't carry it — fall
// back to the month the report was made for, which is what the original
// write would have resolved to via getCurrentSeason() in the common case
// (non-backdated report).
const resolveSeasonId = (data: FirebaseFirestore.DocumentData): string => {
  if (typeof data.seasonId === "string") return data.seasonId;
  const reportDate: Date =
    typeof data.reportDate?.toDate === "function"
      ? data.reportDate.toDate()
      : new Date();
  return `${reportDate.getFullYear()}-${String(
    reportDate.getMonth() + 1
  ).padStart(2, "0")}`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, reportId } = req.body ?? {};

  if (!idToken) {
    return res.status(401).json({ error: "Please include id token" });
  }
  if (!reportId || typeof reportId !== "string") {
    return res.status(400).json({ error: "Missing reportId" });
  }

  let uid: string;
  try {
    ({ uid } = await auth.verifyIdToken(idToken));
  } catch {
    return res.status(401).json({ error: "Invalid id token" });
  }

  const docRef = firestore
    .collection("users")
    .doc(uid)
    .collection("exerciseData")
    .doc(reportId);

  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    return res.status(404).json({ error: "Report not found" });
  }

  const data = snapshot.data() ?? {};
  if (data.planId || data.songId) {
    return res
      .status(403)
      .json({ error: "Only manual reports can be modified" });
  }

  const oldTimeSumary = data.timeSumary ?? {};
  const seasonUserRef = firestore
    .collection("seasons")
    .doc(resolveSeasonId(data))
    .collection("users")
    .doc(uid);

  if (req.method === "DELETE") {
    // The original report additively bumped the season's time.* totals; since
    // those are never re-derived from the still-existing exerciseData docs,
    // deleting the report must subtract back what it originally added or the
    // season leaderboard keeps counting time for a report that no longer
    // exists. longestSession is intentionally left alone — it's a running
    // max, not a sum, and can't be safely decremented without re-scanning
    // every report the user has for the season.
    await Promise.all([
      docRef.delete(),
      seasonUserRef.set(
        {
          "time.technique": FieldValue.increment(
            -(oldTimeSumary.techniqueTime || 0)
          ),
          "time.theory": FieldValue.increment(
            -(oldTimeSumary.theoryTime || 0)
          ),
          "time.hearing": FieldValue.increment(
            -(oldTimeSumary.hearingTime || 0)
          ),
          "time.creativity": FieldValue.increment(
            -(oldTimeSumary.creativityTime || 0)
          ),
        },
        { merge: true }
      ),
    ]);
    invalidateActivityLogsCache(uid);
    return res.status(200).json({ success: true });
  }

  const { updates } = req.body ?? {};
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "Missing updates" });
  }

  const title = typeof updates.title === "string" ? updates.title.trim() : "";
  if (!title || title.length > MAX_TITLE_LENGTH) {
    return res
      .status(400)
      .json({ error: `Title must be 1-${MAX_TITLE_LENGTH} characters` });
  }

  let description: string | undefined;
  if (updates.description !== undefined) {
    if (
      typeof updates.description !== "string" ||
      updates.description.length > MAX_DESCRIPTION_LENGTH
    ) {
      return res.status(400).json({
        error: `Description must be a string up to ${MAX_DESCRIPTION_LENGTH} characters`,
      });
    }
    description = updates.description.trim();
  }

  const timeSumary = updates.timeSumary;
  if (!timeSumary || typeof timeSumary !== "object") {
    return res.status(400).json({ error: "Missing timeSumary" });
  }
  for (const key of TIME_KEYS) {
    if (!isValidTimeMs(timeSumary[key])) {
      return res.status(400).json({ error: `Invalid ${key}` });
    }
  }

  const sumTime = TIME_KEYS.reduce((sum, key) => sum + timeSumary[key], 0);
  if (sumTime <= 0 || sumTime > MAX_TIME_MS) {
    return res
      .status(400)
      .json({ error: "Total time must be between 1 minute and 24 hours" });
  }

  // Deliberately leaves totalPoints, remaining bonusPoints fields, reportDate
  // and isDateBackReport untouched — edits do not affect earned stats.
  // bonusPoints.time mirrors the session duration and drives day totals in
  // the activity calendar, so it must follow the edited time.
  // The season's time.* totals were additively bumped by the original
  // report and must move by the same delta, or a corrected (usually
  // reduced) report leaves the leaderboard showing the stale pre-edit time.
  await Promise.all([
    docRef.update({
      exceriseTitle: title,
      ...(description !== undefined && { description }),
      timeSumary: {
        techniqueTime: timeSumary.techniqueTime,
        theoryTime: timeSumary.theoryTime,
        hearingTime: timeSumary.hearingTime,
        creativityTime: timeSumary.creativityTime,
        sumTime,
      },
      "bonusPoints.time": sumTime,
    }),
    seasonUserRef.set(
      {
        "time.technique": FieldValue.increment(
          timeSumary.techniqueTime - (oldTimeSumary.techniqueTime || 0)
        ),
        "time.theory": FieldValue.increment(
          timeSumary.theoryTime - (oldTimeSumary.theoryTime || 0)
        ),
        "time.hearing": FieldValue.increment(
          timeSumary.hearingTime - (oldTimeSumary.hearingTime || 0)
        ),
        "time.creativity": FieldValue.increment(
          timeSumary.creativityTime - (oldTimeSumary.creativityTime || 0)
        ),
      },
      { merge: true }
    ),
  ]);

  invalidateActivityLogsCache(uid);
  return res.status(200).json({ success: true });
}
