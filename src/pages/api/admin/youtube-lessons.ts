import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import { Index } from "@upstash/vector";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import type { YouTubeLesson, YouTubeLessonStatus } from "feature/aiCoach/types/youtubeLesson.types";

const LESSONS_COLLECTION = "youtubeLessons";
const PAGE_SIZE = 20;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const password = req.headers["x-admin-password"] || req.body?.password || req.query?.password;
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const lessonsRef = collection(db, LESSONS_COLLECTION);

  // GET – list lessons with optional status filter + stats
  if (req.method === "GET") {
    const statusFilter = req.query.status as YouTubeLessonStatus | "all" | undefined;
    const pageLimit = Math.min(parseInt(req.query.limit as string) || PAGE_SIZE, 100);

    try {
      // Stats
      const [rawCount, indexedCount, rejectedCount] = await Promise.all([
        getCountFromServer(query(lessonsRef, where("status", "==", "raw"))),
        getCountFromServer(query(lessonsRef, where("status", "==", "indexed"))),
        getCountFromServer(query(lessonsRef, where("status", "==", "rejected"))),
      ]);

      const stats = {
        raw: rawCount.data().count,
        indexed: indexedCount.data().count,
        rejected: rejectedCount.data().count,
        total: rawCount.data().count + indexedCount.data().count + rejectedCount.data().count,
      };

      // Lessons
      let q;
      if (statusFilter && statusFilter !== "all") {
        q = query(lessonsRef, where("status", "==", statusFilter), limit(pageLimit));
      } else {
        q = query(lessonsRef, limit(pageLimit));
      }

      const snap = await getDocs(q);
      const lessons = snap.docs.map((d) => d.data() as YouTubeLesson);

      return res.status(200).json({ lessons, stats });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH – update lesson status (approve/reject/re-index)
  if (req.method === "PATCH") {
    const { videoId, status } = req.body as { videoId: string; status: YouTubeLessonStatus };

    if (!videoId || !["raw", "indexed", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid videoId or status" });
    }

    try {
      await updateDoc(doc(lessonsRef, videoId), { status });

      // If rejecting an indexed lesson, also remove from Upstash
      if (status === "rejected") {
        const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
        const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;
        if (upstashUrl && upstashToken) {
          const vectorIndex = new Index({ url: upstashUrl, token: upstashToken });
          await vectorIndex.delete(videoId);
        }
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
