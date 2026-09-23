import type {
  ScraperConfig,
  YouTubeLesson,
} from "feature/aiCoach/types/youtubeLesson.types";
import { DEFAULT_SCRAPER_CONFIG } from "feature/aiCoach/types/youtubeLesson.types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { analyzeLesson, upsertLessonVector } from "lib/roadmaps/lessonIndexing";
import { parseChapters } from "lib/roadmaps/lessonText";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";

const LESSONS_COLLECTION = "youtubeLessons";
const ADMIN_CONFIG_COLLECTION = "adminConfig";
const SCRAPER_CONFIG_DOC = "youtubeScraper";
const BATCH_SIZE = 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = req.headers["x-admin-password"] || req.body?.password;
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
  const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (!openaiApiKey || !upstashUrl || !upstashToken) {
    return res
      .status(500)
      .json({
        error:
          "Missing OPENAI_API_KEY, UPSTASH_VECTOR_REST_URL, or UPSTASH_VECTOR_REST_TOKEN",
      });
  }

  // Load config for minQualityScore
  const configRef = doc(db, ADMIN_CONFIG_COLLECTION, SCRAPER_CONFIG_DOC);
  const configSnap = await getDoc(configRef);
  const config: ScraperConfig = configSnap.exists()
    ? (configSnap.data() as ScraperConfig)
    : DEFAULT_SCRAPER_CONFIG;

  // Fetch batch of raw lessons
  const lessonsRef = collection(db, LESSONS_COLLECTION);
  const q = query(lessonsRef, where("status", "==", "raw"), limit(BATCH_SIZE));
  const snap = await getDocs(q);

  if (snap.empty) {
    return res
      .status(200)
      .json({
        success: true,
        processed: 0,
        message: "No raw lessons to process",
      });
  }

  const lessons = snap.docs.map((d) => d.data() as YouTubeLesson);
  let processed = 0;
  let indexed = 0;
  let rejected = 0;

  type LogEntry = {
    videoId: string;
    title: string;
    result: "indexed" | "rejected" | "error";
    qualityScore?: number;
    qualityReason?: string;
    level?: string;
    topics?: string[];
    error?: string;
  };
  const logs: LogEntry[] = [];

  for (const lesson of lessons) {
    try {
      // Step 1: What the video teaches, its level, topics and quality.
      const parsed = await analyzeLesson(lesson);
      const chapters = parseChapters(lesson.description);

      const qualityScore = parsed.qualityScore;
      const processedAt = new Date().toISOString();

      if (qualityScore < config.minQualityScore) {
        await updateDoc(doc(lessonsRef, lesson.videoId), {
          level: parsed.level ?? "all",
          topics: parsed.topics ?? [],
          guitarStyle: parsed.guitarStyle ?? [],
          qualityScore,
          qualityReason: parsed.qualityReason ?? "",
          teaches: parsed.teaches,
          chapters,
          source: "scrape",
          status: "rejected",
          processedAt,
        });
        logs.push({
          videoId: lesson.videoId,
          title: lesson.title,
          result: "rejected",
          qualityScore,
          qualityReason: parsed.qualityReason ?? "",
          level: parsed.level,
          topics: parsed.topics ?? [],
        });
        rejected++;
        processed++;
        continue;
      }

      // Steps 2–3: Embed what it teaches and put it in the vector index.
      await upsertLessonVector(lesson, parsed);

      // Step 4: Update Firestore
      await updateDoc(doc(lessonsRef, lesson.videoId), {
        level: parsed.level ?? "all",
        topics: parsed.topics ?? [],
        guitarStyle: parsed.guitarStyle ?? [],
        qualityScore,
        qualityReason: parsed.qualityReason ?? "",
        teaches: parsed.teaches,
        chapters,
        source: "scrape",
        status: "indexed",
        processedAt,
      });

      logs.push({
        videoId: lesson.videoId,
        title: lesson.title,
        result: "indexed",
        qualityScore,
        qualityReason: parsed.qualityReason ?? "",
        level: parsed.level,
        topics: parsed.topics ?? [],
      });
      indexed++;
      processed++;
    } catch (err: any) {
      console.error(`Failed to process lesson ${lesson.videoId}:`, err);
      logs.push({
        videoId: lesson.videoId,
        title: lesson.title,
        result: "error",
        error: err?.message ?? "Unknown error",
      });
    }
  }

  return res
    .status(200)
    .json({ success: true, processed, indexed, rejected, logs });
}
