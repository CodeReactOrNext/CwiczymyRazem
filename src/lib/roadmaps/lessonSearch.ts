import { Index } from "@upstash/vector";
import type {
  YouTubeLesson,
  YouTubeLessonResult,
} from "feature/aiCoach/types/youtubeLesson.types";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import OpenAI from "openai";
import { firestore } from "utils/firebase/api/firebase.config";

import { GenerationError } from "./generation/openaiJson";
import { type TokenUsage, UsageLedger } from "./generation/usage";
import {
  type JudgeCandidate,
  judgeLessons,
  MAX_LESSONS_PER_STEP,
} from "./lessonJudge";
import {
  indexLiveLesson,
  liveQuery,
  reserveLiveSearch,
  searchYoutube,
  toLiveCandidate,
} from "./youtubeLive";

// ⚠️ Server-only: Admin SDK.

const LESSONS_COLLECTION = "youtubeLessons";
/** Candidates pulled from the index for the judge to choose among. */
const TOP_K = 30;
/**
 * A loose floor: the judge decides relevance now, so this only keeps out what
 * is plainly about something else. text-embedding-3-small scores guitar texts
 * in a narrow band (relevant lessons measured at 0.75–0.89 against the 2182-
 * lesson index), so a strict cut here threw good candidates away.
 */
const MIN_SIMILARITY = 0.7;
const MIN_QUALITY = 7;
/** Used only when the judge itself fails: the old nearest-first behaviour, stricter. */
const FALLBACK_SIMILARITY = 0.8;

export interface LessonSearchParams {
  stepTitle: string;
  stepDescription?: string;
  roadmapGoal?: string;
  roadmapLevel?: string;
  /**
   * Search YouTube itself when nothing in the index fits — within the daily
   * allowance. On by default; the finds join the index for next time.
   */
  live?: boolean;
}

export interface LessonSearchResult {
  lessons: YouTubeLessonResult[];
  /** What the search cost, so the caller can add it to the roadmap's total. */
  usage: Partial<TokenUsage>;
}

const toResult = (
  lesson: YouTubeLesson,
  score?: number,
): YouTubeLessonResult => ({
  videoId: lesson.videoId,
  title: lesson.title,
  channelName: lesson.channelName,
  thumbnailUrl: lesson.thumbnailUrl,
  duration: lesson.duration,
  level: lesson.level,
  topics: lesson.topics,
  ...(score != null ? { score } : {}),
});

const toCandidate = (lesson: YouTubeLesson): JudgeCandidate => ({
  videoId: lesson.videoId,
  title: lesson.title,
  channelName: lesson.channelName,
  level: lesson.level,
  topics: lesson.topics,
  teaches: lesson.teaches,
  chapters: lesson.chapters,
  duration: lesson.duration,
});

/**
 * The lessons that teach one step.
 *
 * 1. The index: the step embedded, the nearest thirty videos of reasonable
 *    quality.
 * 2. The judge: a model reads those candidates and keeps the ones that
 *    actually teach this step — at most three, possibly none. Nearness in
 *    the vector space only says two texts are about guitar in a similar way,
 *    which is how "memorize the fretboard" used to land on an ear-training
 *    step.
 * 3. YouTube, live: when the judge keeps nothing, YouTube's own search for
 *    the step, judged the same way; what passes is analysed and added to the
 *    index, so the catalogue grows where roadmaps actually need it.
 *
 * Shared by the generation job and by the owner's "find lessons again".
 */
export async function searchLessonsForStep({
  stepTitle,
  stepDescription,
  roadmapGoal,
  roadmapLevel,
  live = true,
}: LessonSearchParams): Promise<LessonSearchResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
  const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!openaiApiKey || !upstashUrl || !upstashToken) {
    throw new GenerationError("Server configuration missing", 500);
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const vectorIndex = new Index({ url: upstashUrl, token: upstashToken });
  const ledger = new UsageLedger();

  const queryText = [
    stepTitle,
    stepDescription ? stepDescription.slice(0, 150) : "",
    roadmapGoal ? `goal: ${roadmapGoal}` : "",
    roadmapLevel ? `level: ${roadmapLevel}` : "",
    "guitar lesson tutorial",
  ]
    .filter(Boolean)
    .join(". ");

  const embeddingResp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: queryText,
  });
  ledger.add({
    embeddingTokens: embeddingResp.usage?.total_tokens ?? 0,
    calls: 1,
  });

  const results = await vectorIndex.query({
    vector: embeddingResp.data[0].embedding,
    topK: TOP_K,
    includeMetadata: true,
  });

  const near = results.filter((r) => {
    if (r.score < MIN_SIMILARITY) return false;
    const meta = r.metadata as { qualityScore?: number } | undefined;
    return (
      !meta || meta.qualityScore == null || meta.qualityScore >= MIN_QUALITY
    );
  });
  const scoreOf = new Map(near.map((r) => [String(r.id), r.score]));

  const snaps = near.length
    ? ((await firestore.getAll(
        ...near.map((r) =>
          firestore.collection(LESSONS_COLLECTION).doc(String(r.id)),
        ),
      )) as DocumentSnapshot[])
    : [];
  const indexed = snaps
    .filter((snap) => snap.exists)
    .map((snap) => snap.data() as YouTubeLesson)
    .filter((lesson) => lesson.status !== "rejected");
  const byId = new Map(indexed.map((lesson) => [lesson.videoId, lesson]));

  const judge = {
    stepTitle,
    stepDescription,
    roadmapGoal,
    roadmapLevel,
    ledger,
  };

  let picked: YouTubeLessonResult[];
  try {
    const ids = await judgeLessons({
      ...judge,
      candidates: indexed.map(toCandidate),
    });
    picked = ids
      .map((id) => byId.get(id))
      .filter((lesson): lesson is YouTubeLesson => !!lesson)
      .map((lesson) => toResult(lesson, scoreOf.get(lesson.videoId)));
  } catch (error) {
    // A judge that fails leaves the step with the closest lessons, as before
    // the judge existed — at a stricter floor, since nothing checked them.
    console.error("[lessonSearch] judge failed", stepTitle, error);
    return {
      lessons: indexed
        .filter(
          (lesson) => (scoreOf.get(lesson.videoId) ?? 0) >= FALLBACK_SIMILARITY,
        )
        .slice(0, MAX_LESSONS_PER_STEP)
        .map((lesson) => toResult(lesson, scoreOf.get(lesson.videoId))),
      usage: ledger.totals(),
    };
  }

  if (picked.length || !live || !(await reserveLiveSearch())) {
    return { lessons: picked, usage: ledger.totals() };
  }

  // Nothing in the index teaches this step: ask YouTube.
  try {
    const found = (await searchYoutube(liveQuery(stepTitle))).filter(
      (lesson) => !byId.has(lesson.videoId),
    );
    const ids = await judgeLessons({
      ...judge,
      candidates: found.map(toLiveCandidate),
    });
    const liveById = new Map(found.map((lesson) => [lesson.videoId, lesson]));
    const added = await Promise.all(
      ids.map((id) => indexLiveLesson(liveById.get(id)!, ledger)),
    );
    picked = added.filter(
      (lesson): lesson is YouTubeLessonResult => lesson !== null,
    );
  } catch (error) {
    // A step with no lesson is a fine outcome; a failed live search is not
    // worth failing the roadmap over.
    console.error("[lessonSearch] live search failed", stepTitle, error);
  }

  return { lessons: picked, usage: ledger.totals() };
}
