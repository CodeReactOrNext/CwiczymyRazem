import { invalidateActivityLogsCache } from "feature/logs/services/getUserRaprotsLogs.service";
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

  if (req.method === "DELETE") {
    await docRef.delete();
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
  await docRef.update({
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
  });

  invalidateActivityLogsCache(uid);
  return res.status(200).json({ success: true });
}
