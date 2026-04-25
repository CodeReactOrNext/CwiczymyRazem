import { Index } from "@upstash/vector";
import type { ScraperConfig, YouTubeLesson } from "feature/aiCoach/types/youtubeLesson.types";
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
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { db } from "utils/firebase/client/firebase.utils";

const LESSONS_COLLECTION = "youtubeLessons";
const ADMIN_CONFIG_COLLECTION = "adminConfig";
const SCRAPER_CONFIG_DOC = "youtubeScraper";
const BATCH_SIZE = 10;

const CATEGORIZE_PROMPT = `You are a guitar lesson analyzer. Given a YouTube lesson title and description, return ONLY valid JSON with no markdown:
{
  "level": "beginner" | "intermediate" | "advanced" | "all",
  "topics": ["topic1", "topic2"],
  "guitarStyle": ["acoustic" | "electric" | "fingerpicking" | "strumming" | "lead" | "classical" | "blues" | "jazz" | "rock"],
  "qualityScore": <number 1-10>,
  "qualityReason": "<brief reason>"
}

Scoring guide:
- 8-10: Clear structure, specific topic, professional channel, good description
- 6-7: Decent content, somewhat specific
- 4-5: Vague title, poor description, or low-effort content
- 1-3: Spam, clickbait, or unrelated to guitar learning`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    return res.status(500).json({ error: "Missing OPENAI_API_KEY, UPSTASH_VECTOR_REST_URL, or UPSTASH_VECTOR_REST_TOKEN" });
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const vectorIndex = new Index({ url: upstashUrl, token: upstashToken });

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
    return res.status(200).json({ success: true, processed: 0, message: "No raw lessons to process" });
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
      // Step 1: Categorize with gpt-4o-mini
      const completion = await openai.chat.completions.create({
        model: "gpt-5-nano",
        temperature: 0.1,
        max_tokens: 200,
        messages: [
          { role: "system", content: CATEGORIZE_PROMPT },
          {
            role: "user",
            content: `Title: ${lesson.title}\nChannel: ${lesson.channelName}\nDescription: ${lesson.description}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }

      const qualityScore: number = parsed.qualityScore ?? 5;
      const processedAt = new Date().toISOString();

      if (qualityScore < config.minQualityScore) {
        await updateDoc(doc(lessonsRef, lesson.videoId), {
          level: parsed.level ?? "all",
          topics: parsed.topics ?? [],
          guitarStyle: parsed.guitarStyle ?? [],
          qualityScore,
          qualityReason: parsed.qualityReason ?? "",
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

      // Step 2: Create embedding
      const textToEmbed = `${lesson.title}. Topics: ${(parsed.topics || []).join(", ")}. Style: ${(parsed.guitarStyle || []).join(", ")}. Level: ${parsed.level ?? ""}. ${lesson.description.slice(0, 200)}`;
      const embeddingResp = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textToEmbed,
      });
      const embedding = embeddingResp.data[0].embedding;

      // Step 3: Upsert to Upstash Vector
      await vectorIndex.upsert({
        id: lesson.videoId,
        vector: embedding,
        metadata: {
          level: parsed.level ?? "all",
          topics: (parsed.topics ?? []).join(","),
          guitarStyle: (parsed.guitarStyle ?? []).join(","),
          qualityScore,
        },
      });

      // Step 4: Update Firestore
      await updateDoc(doc(lessonsRef, lesson.videoId), {
        level: parsed.level ?? "all",
        topics: parsed.topics ?? [],
        guitarStyle: parsed.guitarStyle ?? [],
        qualityScore,
        qualityReason: parsed.qualityReason ?? "",
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

  return res.status(200).json({ success: true, processed, indexed, rejected, logs });
}
