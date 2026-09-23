import type {
  YouTubeLesson,
  YouTubeLessonResult,
} from "feature/aiCoach/types/youtubeLesson.types";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { firestore } from "utils/firebase/api/firebase.config";

import type { UsageLedger } from "./generation/usage";
import { analyzeLesson, upsertLessonVector } from "./lessonIndexing";
import type { JudgeCandidate } from "./lessonJudge";
import { parseChapters } from "./lessonText";

// ⚠️ Server-only: Admin SDK and the YouTube API key.

const LESSONS_COLLECTION = "youtubeLessons";
const QUOTA_DOC = "adminConfig/youtubeLiveQuota";

/**
 * Live searches a day. One search costs 101 units of the YouTube Data API's
 * daily 10 000 (100 for search.list, 1 for the video details), and the admin
 * scraper spends from the same pool — so the live search stops well short.
 */
export const LIVE_SEARCHES_PER_DAY = 70;
/** Results per live search handed to the judge. */
const LIVE_RESULTS = 12;
const MIN_VIEWS = 2000;
const MIN_SECONDS = 120;
const MAX_SECONDS = 45 * 60;
/** A live find is only indexed when the analyzer rates it at least this. */
const MIN_LIVE_QUALITY = 6;

const dayKey = (now = new Date()) => now.toISOString().slice(0, 10);

/**
 * Takes one live search from today's allowance, or answers false when it is
 * spent. A transaction, so parallel steps cannot overdraw it.
 */
export async function reserveLiveSearch(now = new Date()): Promise<boolean> {
  const ref = firestore.doc(QUOTA_DOC) as DocumentReference;
  return firestore.runTransaction(async (tx: Transaction) => {
    const snap = (await tx.get(ref)) as DocumentSnapshot;
    const data = snap.data() as { day?: string; used?: number } | undefined;
    const used = data?.day === dayKey(now) ? (data.used ?? 0) : 0;
    if (used >= LIVE_SEARCHES_PER_DAY) return false;
    tx.set(ref, { day: dayKey(now), used: used + 1 });
    return true;
  });
}

const parseDuration = (iso: string): number => {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    Number(match[1] ?? 0) * 3600 +
    Number(match[2] ?? 0) * 60 +
    Number(match[3] ?? 0)
  );
};

/** The live search query for a step: its title, as a lesson. */
export const liveQuery = (stepTitle: string): string =>
  `${stepTitle.replace(/[—–:]/g, " ").replace(/\s+/g, " ").trim()} guitar lesson`;

/**
 * YouTube's own search for one step, cut to plausible lessons: long enough to
 * teach something, short enough to be a lesson, watched by someone.
 */
export async function searchYoutube(query: string): Promise<YouTubeLesson[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("relevanceLanguage", "en");
  searchUrl.searchParams.set("maxResults", String(LIVE_RESULTS));
  searchUrl.searchParams.set("key", apiKey);

  const searchResp = await fetch(searchUrl.toString());
  if (!searchResp.ok) {
    console.error("[youtubeLive] search failed", await searchResp.text());
    return [];
  }
  const ids: string[] = ((await searchResp.json()).items ?? [])
    .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .filter(Boolean);
  if (!ids.length) return [];

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "snippet,contentDetails,statistics");
  detailsUrl.searchParams.set("id", ids.join(","));
  detailsUrl.searchParams.set("key", apiKey);
  const detailsResp = await fetch(detailsUrl.toString());
  if (!detailsResp.ok) return [];

  type Video = {
    id: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    contentDetails?: { duration?: string };
    statistics?: { viewCount?: string };
  };

  return (((await detailsResp.json()).items ?? []) as Video[])
    .map((video) => {
      const thumbnails = video.snippet?.thumbnails ?? {};
      return {
        videoId: video.id,
        title: video.snippet?.title ?? "",
        channelName: video.snippet?.channelTitle ?? "",
        description: video.snippet?.description ?? "",
        duration: parseDuration(video.contentDetails?.duration ?? ""),
        thumbnailUrl:
          thumbnails.high?.url ??
          thumbnails.medium?.url ??
          thumbnails.default?.url ??
          "",
        publishedAt: video.snippet?.publishedAt ?? "",
        viewCount: Number(video.statistics?.viewCount ?? 0),
        status: "raw" as const,
        source: "live" as const,
      };
    })
    .filter(
      (lesson) =>
        lesson.title &&
        lesson.viewCount >= MIN_VIEWS &&
        lesson.duration >= MIN_SECONDS &&
        lesson.duration <= MAX_SECONDS,
    );
}

/** A live result as the judge sees it. */
export const toLiveCandidate = (lesson: YouTubeLesson): JudgeCandidate => ({
  videoId: lesson.videoId,
  title: lesson.title,
  channelName: lesson.channelName,
  duration: lesson.duration,
  chapters: parseChapters(lesson.description),
  teaches: lesson.description.slice(0, 200).replace(/\s+/g, " "),
});

const toResult = (lesson: YouTubeLesson): YouTubeLessonResult => ({
  videoId: lesson.videoId,
  title: lesson.title,
  channelName: lesson.channelName,
  thumbnailUrl: lesson.thumbnailUrl,
  duration: lesson.duration,
  level: lesson.level,
  topics: lesson.topics,
});

/**
 * A live find the judge accepted, analysed and put in the index, so the next
 * roadmap that needs this skill finds it without a search. Answers the lesson
 * for the step — or null when the analyzer rates it too low to keep.
 */
export async function indexLiveLesson(
  lesson: YouTubeLesson,
  ledger?: UsageLedger,
): Promise<YouTubeLessonResult | null> {
  const ref = firestore.collection(LESSONS_COLLECTION).doc(lesson.videoId);
  const existing = (await ref.get()) as DocumentSnapshot;
  const stored = existing.exists ? (existing.data() as YouTubeLesson) : null;

  if (stored?.status === "rejected") return null;
  if (stored?.status !== "indexed") {
    const analysis = await analyzeLesson(lesson, ledger);
    const processedAt = new Date().toISOString();
    const record: YouTubeLesson = {
      ...lesson,
      level: analysis.level,
      topics: analysis.topics,
      guitarStyle: analysis.guitarStyle,
      qualityScore: analysis.qualityScore,
      qualityReason: analysis.qualityReason,
      teaches: analysis.teaches,
      chapters: parseChapters(lesson.description),
      source: "live",
      status:
        analysis.qualityScore >= MIN_LIVE_QUALITY ? "indexed" : "rejected",
      processedAt,
    };
    if (record.status === "indexed") {
      await upsertLessonVector(lesson, analysis, ledger);
    }
    await ref.set(JSON.parse(JSON.stringify(record)));
    if (record.status !== "indexed") return null;
    return toResult(record);
  }
  return toResult(stored);
}
