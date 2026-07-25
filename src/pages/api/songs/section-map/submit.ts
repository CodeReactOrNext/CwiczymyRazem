import type { SectionMapEntry, SongSectionMapSubmission } from "feature/songs/types/songSectionMap.type";
import { upsertSubmissionAndRecompute } from "feature/songs/utils/sectionMapConsensus.utils";
import {
  MAX_SUBMISSIONS_PER_DAY,
  validateSectionMapSubmission,
} from "feature/songs/utils/sectionMapValidation.utils";
import { buildSongSectionMapId } from "feature/songs/utils/youtube.utils";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, songId, videoId, sections } = req.body as {
    idToken: string;
    songId: string;
    videoId: string;
    sections: SectionMapEntry[];
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!songId || !videoId) {
    return res.status(400).json({ error: "Missing songId or videoId" });
  }
  if (!Array.isArray(sections)) {
    return res.status(400).json({ error: "Missing sections" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Strip anything beyond name/startTime (e.g. id/color/mastery) even if a
  // client sends them, and run structural validation before any Firestore I/O.
  const cleanedSections: SectionMapEntry[] = sections.map((s) => ({
    name: String(s?.name ?? "").trim().slice(0, 60),
    startTime: Number(s?.startTime),
  }));

  const validation = validateSectionMapSubmission({ sections: cleanedSections });
  if (!validation.valid) {
    return res
      .status(400)
      .json({ error: "Invalid section map", reason: validation.reason });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const rateLimitRef = firestore
      .collection("users")
      .doc(userId)
      .collection("rateLimits")
      .doc("sectionMapSubmit") as DocumentReference;
    const progressRef = firestore
      .collection("users")
      .doc(userId)
      .collection("songProgress")
      .doc(songId) as DocumentReference;
    const userRef = firestore.collection("users").doc(userId) as DocumentReference;
    const mapId = buildSongSectionMapId(songId, videoId);
    const mapRef = firestore
      .collection("songSectionMaps")
      .doc(mapId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const [rateLimitDoc, progressDoc, userDoc, mapDoc] = await Promise.all([
        t.get(rateLimitRef),
        t.get(progressRef),
        t.get(userRef),
        t.get(mapRef),
      ]);

      const rateLimitData = rateLimitDoc.data() as
        | { date?: string; count?: number }
        | undefined;
      const currentCount =
        rateLimitData?.date === today ? rateLimitData.count ?? 0 : 0;
      if (currentCount >= MAX_SUBMISSIONS_PER_DAY) {
        throw new Error("RATE_LIMITED");
      }

      const progress = progressDoc.data() as
        | { sessionCount?: number; totalPracticeMs?: number }
        | undefined;
      const hasPracticed =
        (progress?.sessionCount ?? 0) > 0 || (progress?.totalPracticeMs ?? 0) > 0;
      if (!hasPracticed) {
        throw new Error("NOT_PRACTICED");
      }

      const username = (userDoc.data()?.displayName as string) || "Unknown User";

      const existingSubmissions = mapDoc.exists
        ? ((mapDoc.data()?.submissions ?? []) as SongSectionMapSubmission[])
        : [];

      const incoming: SongSectionMapSubmission = {
        userId,
        username,
        sections: cleanedSections,
        submittedAt: Timestamp.now(),
      };

      const upserted = upsertSubmissionAndRecompute(existingSubmissions, incoming);

      t.set(
        mapRef,
        {
          songId,
          videoId,
          submissions: upserted.submissions,
          consensusSections: upserted.consensusSections,
          contributorCount: upserted.contributorCount,
          status: upserted.status,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      t.set(rateLimitRef, { date: today, count: currentCount + 1 }, { merge: true });

      return {
        status: upserted.status,
        consensusSections: upserted.consensusSections,
      };
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    switch (error.message) {
      case "RATE_LIMITED":
        return res.status(429).json({ error: "Daily sharing limit reached" });
      case "NOT_PRACTICED":
        return res
          .status(403)
          .json({ error: "Practice this song before sharing a map" });
      default:
        console.error("[songs/section-map/submit]", error);
        return res.status(500).json({ error: "Internal server error" });
    }
  }
}
