import { collection, doc, getDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { Index } from "@upstash/vector";
import { db } from "utils/firebase/client/firebase.utils";
import type { YouTubeLesson, YouTubeLessonResult } from "feature/aiCoach/types/youtubeLesson.types";

const LESSONS_COLLECTION = "youtubeLessons";
const TOP_K = 8;
const RESULTS = 5;
const MIN_SIMILARITY = 0.7;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
  const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (!openaiApiKey || !upstashUrl || !upstashToken) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const { stepTitle, stepDescription, roadmapGoal, roadmapLevel } = req.body as {
    stepTitle: string;
    stepDescription?: string;
    roadmapGoal?: string;
    roadmapLevel?: string;
  };

  if (!stepTitle || typeof stepTitle !== "string" || stepTitle.length > 200) {
    return res.status(400).json({ error: "Invalid stepTitle" });
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const vectorIndex = new Index({ url: upstashUrl, token: upstashToken });

  // Build query text
  const queryText = [
    stepTitle,
    stepDescription ? stepDescription.slice(0, 150) : "",
    roadmapGoal ? `goal: ${roadmapGoal}` : "",
    roadmapLevel ? `level: ${roadmapLevel}` : "",
    "guitar lesson tutorial",
  ]
    .filter(Boolean)
    .join(". ");

  try {
    // Embed query
    const embeddingResp = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: queryText,
    });
    const queryVector = embeddingResp.data[0].embedding;

    // Search Upstash Vector
    const results = await vectorIndex.query({
      vector: queryVector,
      topK: TOP_K,
      includeMetadata: true,
    });

    // Filter by similarity threshold and quality score, take top 5
    const filtered = results
      .filter((r) => {
        if (r.score < MIN_SIMILARITY) return false;
        const meta = r.metadata as any;
        return !meta || meta.qualityScore == null || meta.qualityScore >= 7;
      })
      .slice(0, RESULTS);

    if (!filtered.length) {
      return res.status(200).json({ lessons: [] });
    }

    // Fetch Firestore metadata
    const videoIds = filtered.map((r) => String(r.id));
    const lessons: YouTubeLessonResult[] = [];

    for (const videoId of videoIds) {
      const ref = doc(collection(db, LESSONS_COLLECTION), videoId);
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;
      const lesson = snap.data() as YouTubeLesson;
      const vectorResult = filtered.find((r) => String(r.id) === videoId);

      lessons.push({
        videoId: lesson.videoId,
        title: lesson.title,
        channelName: lesson.channelName,
        thumbnailUrl: lesson.thumbnailUrl,
        duration: lesson.duration,
        level: lesson.level,
        topics: lesson.topics,
        score: vectorResult?.score ?? 0,
      });
    }

    return res.status(200).json({ lessons });
  } catch (err: any) {
    console.error("search-youtube-lessons error:", err);
    return res.status(200).json({ lessons: [] });
  }
}
