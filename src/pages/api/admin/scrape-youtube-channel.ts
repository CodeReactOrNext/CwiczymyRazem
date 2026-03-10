import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import type { ScraperConfig, YouTubeLesson } from "feature/aiCoach/types/youtubeLesson.types";
import { DEFAULT_SCRAPER_CONFIG } from "feature/aiCoach/types/youtubeLesson.types";

const LESSONS_COLLECTION = "youtubeLessons";

function parseDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return parseInt(match[1] || "0") * 3600 + parseInt(match[2] || "0") * 60 + parseInt(match[3] || "0");
}

function parseChannelInput(input: string): { type: "id" | "handle" | "custom"; value: string } {
  const trimmed = input.trim();
  // Full URL: https://www.youtube.com/channel/UCxxx or https://www.youtube.com/@handle
  const channelIdMatch = trimmed.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (channelIdMatch) return { type: "id", value: channelIdMatch[1] };

  const handleFromUrl = trimmed.match(/youtube\.com\/@([\w.-]+)/);
  if (handleFromUrl) return { type: "handle", value: `@${handleFromUrl[1]}` };

  const customUrlMatch = trimmed.match(/youtube\.com\/c\/([\w.-]+)/);
  if (customUrlMatch) return { type: "custom", value: customUrlMatch[1] };

  const userMatch = trimmed.match(/youtube\.com\/user\/([\w.-]+)/);
  if (userMatch) return { type: "custom", value: userMatch[1] };

  // Direct handle: @handle
  if (trimmed.startsWith("@")) return { type: "handle", value: trimmed };

  // Channel ID directly: UCxxx
  if (trimmed.startsWith("UC")) return { type: "id", value: trimmed };

  // Assume handle without @
  return { type: "handle", value: `@${trimmed}` };
}

async function resolveChannelId(input: string, apiKey: string): Promise<string | null> {
  const parsed = parseChannelInput(input);

  if (parsed.type === "id") return parsed.value;

  // Use channels API with forHandle for @handle
  if (parsed.type === "handle") {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "id");
    url.searchParams.set("forHandle", parsed.value);
    url.searchParams.set("key", apiKey);
    const resp = await fetch(url.toString());
    if (resp.ok) {
      const data = await resp.json();
      if (data.items?.[0]?.id) return data.items[0].id;
    }
  }

  // Fallback: search for the channel by name/custom URL
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", parsed.value.replace("@", ""));
  searchUrl.searchParams.set("type", "channel");
  searchUrl.searchParams.set("maxResults", "1");
  searchUrl.searchParams.set("key", apiKey);
  const searchResp = await fetch(searchUrl.toString());
  if (!searchResp.ok) return null;
  const searchData = await searchResp.json();
  return searchData.items?.[0]?.id?.channelId || null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const password = req.headers["x-admin-password"] || req.body?.password;
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) return res.status(500).json({ error: "YOUTUBE_API_KEY not configured" });

  const { channelInput, maxVideos = 200, config: bodyConfig } = req.body as {
    channelInput: string;
    maxVideos?: number;
    config?: Partial<ScraperConfig>;
  };
  if (!channelInput?.trim()) return res.status(400).json({ error: "channelInput is required" });

  try {
    const config: ScraperConfig = bodyConfig
      ? { ...DEFAULT_SCRAPER_CONFIG, ...bodyConfig }
      : DEFAULT_SCRAPER_CONFIG;

    const { minViewCount, minDurationSeconds, maxDurationSeconds, excludedChannels } = config;
    const lowerExcluded = excludedChannels.map((c) => c.toLowerCase());
    const lessonsRef = collection(db, LESSONS_COLLECTION);

    // Resolve channel ID
    const channelId = await resolveChannelId(channelInput, youtubeApiKey);
    if (!channelId) {
      return res.status(404).json({ error: `Could not resolve channel: "${channelInput}"` });
    }

    // Fetch channel info for display name
    const channelInfoUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelInfoUrl.searchParams.set("part", "snippet");
    channelInfoUrl.searchParams.set("id", channelId);
    channelInfoUrl.searchParams.set("key", youtubeApiKey);
    const channelInfoResp = await fetch(channelInfoUrl.toString());
    const channelInfoData = channelInfoResp.ok ? await channelInfoResp.json() : null;
    const channelName = channelInfoData?.items?.[0]?.snippet?.title || channelInput;

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
    let totalNew = 0;
    let totalSkipped = 0;
    let pageToken: string | undefined;
    const collected: string[] = [];

    // Paginate through channel videos via search API
    while (collected.length < maxVideos) {
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("channelId", channelId);
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("order", "viewCount");
      searchUrl.searchParams.set("maxResults", "50");
      searchUrl.searchParams.set("key", youtubeApiKey);
      if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

      const searchResp = await fetch(searchUrl.toString());
      if (!searchResp.ok) {
        const errText = await searchResp.text();
        throw new Error(`YouTube Search API error ${searchResp.status}: ${errText.slice(0, 200)}`);
      }
      const searchData = await searchResp.json();
      if (searchData.error) {
        throw new Error(`YouTube API error: ${searchData.error.message}`);
      }
      const items: any[] = searchData.items || [];
      const ids = items.map((i: any) => i.id?.videoId).filter(Boolean);
      collected.push(...ids);
      pageToken = searchData.nextPageToken;
      if (!pageToken) break;
    }

    const videoIds = collected.slice(0, maxVideos);
    if (videoIds.length === 0) {
      return res.status(200).json({ success: true, channelName, channelId, newLessons: 0, skipped: 0, logs });
    }

    // Fetch details in batches of 50
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      detailsUrl.searchParams.set("part", "snippet,contentDetails,statistics");
      detailsUrl.searchParams.set("id", batch.join(","));
      detailsUrl.searchParams.set("key", youtubeApiKey);

      const detailsResp = await fetch(detailsUrl.toString());
      if (!detailsResp.ok) continue;
      const detailsData = await detailsResp.json();

      for (const video of detailsData.items || []) {
        const videoId: string = video.id;
        const snippet = video.snippet;
        const statistics = video.statistics;
        const title: string = snippet.title || "";
        const viewCount = parseInt(statistics?.viewCount || "0");
        const duration = parseDurationToSeconds(video.contentDetails?.duration || "");
        const vChannel: string = snippet.channelTitle || channelName;

        if (lowerExcluded.includes(vChannel.toLowerCase())) {
          logs.push({ videoId, title, channelName: vChannel, viewCount, duration, result: "skipped", skipReason: "Excluded channel" });
          totalSkipped++;
          continue;
        }
        if (viewCount < minViewCount) {
          logs.push({ videoId, title, channelName: vChannel, viewCount, duration, result: "skipped", skipReason: `Too few views (${viewCount.toLocaleString()} < ${minViewCount.toLocaleString()})` });
          totalSkipped++;
          continue;
        }
        if (duration < minDurationSeconds || duration > maxDurationSeconds) {
          logs.push({ videoId, title, channelName: vChannel, viewCount, duration, result: "skipped", skipReason: `Duration out of range (${Math.floor(duration / 60)}m)` });
          totalSkipped++;
          continue;
        }

        const existingSnap = await getDoc(doc(lessonsRef, videoId));
        if (existingSnap.exists()) {
          logs.push({ videoId, title, channelName: vChannel, viewCount, duration, result: "skipped", skipReason: "Already in database" });
          totalSkipped++;
          continue;
        }

        const lesson: YouTubeLesson = {
          videoId,
          title,
          channelName: vChannel,
          description: (snippet.description || "").slice(0, 500),
          duration,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          publishedAt: snippet.publishedAt || "",
          viewCount,
          status: "raw",
        };

        await setDoc(doc(lessonsRef, videoId), lesson);
        logs.push({ videoId, title, channelName: vChannel, viewCount, duration, result: "saved" });
        totalNew++;
      }
    }

    return res.status(200).json({
      success: true,
      channelName,
      channelId,
      newLessons: totalNew,
      skipped: totalSkipped,
      logs,
    });
  } catch (err: any) {
    console.error("scrape-youtube-channel error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
