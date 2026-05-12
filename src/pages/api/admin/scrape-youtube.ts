import type { ScraperConfig, YouTubeLesson } from "feature/aiCoach/types/youtubeLesson.types";
import { DEFAULT_SCRAPER_CONFIG } from "feature/aiCoach/types/youtubeLesson.types";
import {
  collection,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";

const LESSONS_COLLECTION = "youtubeLessons";

function parseDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const password = req.headers["x-admin-password"] || req.body?.password;
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    return res.status(500).json({ error: "YOUTUBE_API_KEY not configured" });
  }

  const config: ScraperConfig = req.body?.config
    ? { ...DEFAULT_SCRAPER_CONFIG, ...req.body.config }
    : DEFAULT_SCRAPER_CONFIG;

  const {
    searchQueries,
    minViewCount,
    minDurationSeconds,
    maxDurationSeconds,
    excludedChannels,
  } = config;

  try {
  const lowerExcluded = excludedChannels.map((c) => c.toLowerCase());
  const lessonsRef = collection(db, LESSONS_COLLECTION);

  let totalNew = 0;
  let totalSkipped = 0;

  type ScrapeLog = {
    videoId: string;
    title: string;
    channelName: string;
    viewCount: number;
    duration: number;
    result: "saved" | "skipped";
    skipReason?: string;
  };
  const logs: ScrapeLog[] = [];

  for (const queryText of searchQueries) {
    // Search YouTube
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", queryText);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoCategoryId", "10");
    searchUrl.searchParams.set("relevanceLanguage", "en");
    searchUrl.searchParams.set("videoDuration", "medium");
    searchUrl.searchParams.set("maxResults", "50");
    searchUrl.searchParams.set("key", youtubeApiKey);

    const searchResp = await fetch(searchUrl.toString());
    if (!searchResp.ok) {
      console.error(`YouTube search failed for query "${queryText}":`, await searchResp.text());
      continue;
    }
    const searchData = await searchResp.json();
    const items: any[] = searchData.items || [];
    const videoIds = items.map((i: any) => i.id?.videoId).filter(Boolean);

    if (!videoIds.length) continue;

    // Get video details
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.searchParams.set("part", "snippet,contentDetails,statistics");
    detailsUrl.searchParams.set("id", videoIds.join(","));
    detailsUrl.searchParams.set("key", youtubeApiKey);

    const detailsResp = await fetch(detailsUrl.toString());
    if (!detailsResp.ok) continue;
    const detailsData = await detailsResp.json();

    for (const video of detailsData.items || []) {
      const videoId: string = video.id;
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;
      const statistics = video.statistics;

      const channelName: string = snippet.channelTitle || "";
      const viewCount = parseInt(statistics?.viewCount || "0");
      const duration = parseDurationToSeconds(contentDetails?.duration || "");

      const title: string = snippet.title || "";

      // Apply filters
      if (lowerExcluded.includes(channelName.toLowerCase())) {
        logs.push({ videoId, title, channelName, viewCount, duration, result: "skipped", skipReason: "Excluded channel" });
        totalSkipped++;
        continue;
      }
      if (viewCount < minViewCount) {
        logs.push({ videoId, title, channelName, viewCount, duration, result: "skipped", skipReason: `Too few views (${viewCount.toLocaleString()} < ${minViewCount.toLocaleString()})` });
        totalSkipped++;
        continue;
      }
      if (duration < minDurationSeconds || duration > maxDurationSeconds) {
        const m = Math.floor(duration / 60);
        logs.push({ videoId, title, channelName, viewCount, duration, result: "skipped", skipReason: `Duration out of range (${m}m)` });
        totalSkipped++;
        continue;
      }

      // Skip if already exists
      const existingRef = doc(lessonsRef, videoId);
      const existingSnap = await getDoc(existingRef);
      if (existingSnap.exists()) {
        logs.push({ videoId, title, channelName, viewCount, duration, result: "skipped", skipReason: "Already in database" });
        totalSkipped++;
        continue;
      }

      const lesson: YouTubeLesson = {
        videoId,
        title,
        channelName,
        description: (snippet.description || "").slice(0, 500),
        duration,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        publishedAt: snippet.publishedAt || "",
        viewCount,
        status: "raw",
      };

      await setDoc(doc(lessonsRef, videoId), lesson);
      logs.push({ videoId, title, channelName, viewCount, duration, result: "saved" });
      totalNew++;
    }
  }

  return res.status(200).json({
    success: true,
    newLessons: totalNew,
    skipped: totalSkipped,
    logs,
  });
  } catch (err: any) {
    console.error("scrape-youtube error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
