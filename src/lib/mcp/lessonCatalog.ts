import { titleTokens } from "lib/roadmaps/generation/titleOverlap";

import { firestore } from "./db";

/**
 * The YouTube lessons an AI client can put on a roadmap step, searchable by
 * plain words — no embedding, no model of ours. The in-app generator finds
 * lessons with a vector search and a judge model; here the client's own model
 * is the judge, so all it needs from us is candidates.
 *
 * The lessons live one document each (about 2 200 of them). Reading them all
 * for every search would cost thousands of reads, so the fields a search
 * needs are packed into a single cached document, rebuilt once a week, and
 * kept in memory for an hour.
 */
export interface CatalogLesson {
  id: string;
  title: string;
  channel: string;
  level: string;
  topics: string[];
  quality: number;
  minutes: number;
}

const LESSONS = "youtubeLessons";
const cacheDoc = () =>
  firestore.collection("adminConfig").doc("mcpLessonCatalog");
const REBUILD_EVERY_MS = 7 * 24 * 60 * 60 * 1000;
const MEMORY_TTL_MS = 60 * 60 * 1000;
/** Below this the scraper's own score says the video is not worth a step. */
export const MIN_LESSON_QUALITY = 7;
/** A Firestore document holds 1 MiB; the packed catalogue stays well under it. */
const MAX_PACKED_BYTES = 850_000;

let memory: { lessons: CatalogLesson[]; at: number } | null = null;

/** The catalogue as one string, best lessons first, cut to fit a document. */
export const packLessons = (lessons: CatalogLesson[]): string => {
  const rows = [...lessons]
    .sort((a, b) => b.quality - a.quality)
    .map((lesson) =>
      JSON.stringify([
        lesson.id,
        lesson.title,
        lesson.channel,
        lesson.level,
        lesson.topics,
        lesson.quality,
        lesson.minutes,
      ]),
    );
  const kept: string[] = [];
  let bytes = 2;
  for (const row of rows) {
    const size = Buffer.byteLength(row, "utf8") + 1;
    if (bytes + size > MAX_PACKED_BYTES) break;
    kept.push(row);
    bytes += size;
  }
  return `[${kept.join(",")}]`;
};

export const unpackLessons = (packed: string): CatalogLesson[] =>
  (JSON.parse(packed) as unknown[][]).map(
    ([id, title, channel, level, topics, quality, minutes]) => ({
      id: String(id),
      title: String(title),
      channel: String(channel),
      level: String(level),
      topics: (topics as string[]) ?? [],
      quality: Number(quality),
      minutes: Number(minutes),
    }),
  );

async function rebuild(): Promise<CatalogLesson[]> {
  const snap = await firestore
    .collection(LESSONS)
    .where("status", "==", "indexed")
    .select(
      "title",
      "channelName",
      "level",
      "topics",
      "guitarStyle",
      "qualityScore",
      "duration",
    )
    .get();
  const lessons: CatalogLesson[] = snap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: String(data.title ?? ""),
        channel: String(data.channelName ?? ""),
        level: String(data.level ?? "all"),
        topics: [
          ...((data.topics as string[] | undefined) ?? []),
          ...((data.guitarStyle as string[] | undefined) ?? []),
        ],
        quality: Number(data.qualityScore ?? 0),
        minutes: Math.round(Number(data.duration ?? 0) / 60),
      };
    })
    .filter((lesson) => lesson.title && lesson.quality >= MIN_LESSON_QUALITY);
  const packed = packLessons(lessons);
  await cacheDoc().set({ packed, builtAt: Date.now(), count: lessons.length });
  return unpackLessons(packed);
}

/** Every lesson a step may carry — from memory, the cached document, or a rebuild. */
export async function readLessonCatalog(
  now = Date.now(),
): Promise<CatalogLesson[]> {
  if (memory && now - memory.at < MEMORY_TTL_MS) return memory.lessons;
  const cached = (await cacheDoc().get()).data() as
    | { packed?: string; builtAt?: number }
    | undefined;
  const fresh =
    cached?.packed && now - (cached.builtAt ?? 0) < REBUILD_EVERY_MS
      ? unpackLessons(cached.packed)
      : await rebuild();
  memory = { lessons: fresh, at: now };
  return fresh;
}

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type LessonLevel = (typeof LEVELS)[number];
export const LESSON_LEVELS: readonly LessonLevel[] = LEVELS;

const lessonTokens = (lesson: CatalogLesson) =>
  titleTokens(`${lesson.title} ${lesson.topics.join(" ")}`);

/** Words nearly every lesson title has — they say nothing about the topic. */
const GENERIC = new Set(
  ["guitar", "lesson", "tutorial", "how", "play", "learn", "easy", "best"].map(
    (word) =>
      [...titleTokens(`${word} x`)].find((token) => token !== "x") ?? word,
  ),
);
/** A word more than half the lessons share is as good as generic. */
const COMMON_SHARE = 0.5;
/** Shares mean nothing on a handful of lessons. */
const MIN_INDEX_FOR_SHARE = 50;

/**
 * The lessons that share the most — and the rarest — words with the query,
 * better-rated first among equals. A word every lesson has ("guitar",
 * "lesson") counts for almost nothing; one a handful have ("sweep", "CAGED")
 * decides the order. Pure.
 */
export const searchLessons = (
  lessons: CatalogLesson[],
  text: string,
  { level, limit = 10 }: { level?: LessonLevel; limit?: number } = {},
): CatalogLesson[] => {
  const query = [...titleTokens(text)];
  if (!query.length) return [];

  const pool = level
    ? lessons.filter(
        (lesson) => lesson.level === level || lesson.level === "all",
      )
    : lessons;
  // How common a word is, is measured on the whole index — a level filter
  // that leaves three lessons must not make every word in them "common".
  const all = lessons.map(lessonTokens);
  const tokens = level ? pool.map(lessonTokens) : all;
  const having = new Map(
    query.map(
      (term) => [term, all.filter((set) => set.has(term)).length] as const,
    ),
  );
  const weight = (term: string) => {
    const count = having.get(term) ?? 0;
    return count ? Math.log(1 + lessons.length / count) : 0;
  };
  // The words that can tell one lesson from another: not "guitar", not
  // "lesson", not anything most of a real-sized index has.
  const sized = lessons.length >= MIN_INDEX_FOR_SHARE;
  const telling = query.filter(
    (term) =>
      !GENERIC.has(term) &&
      (!sized || (having.get(term) ?? 0) <= lessons.length * COMMON_SHARE),
  );
  if (!telling.length) return [];
  const needed = Math.min(2, telling.length);

  const scored = pool
    .map((lesson, index) => {
      let score = 0;
      let matched = 0;
      for (const term of query) {
        if (!tokens[index].has(term)) continue;
        score += weight(term);
        if (telling.includes(term)) matched += 1;
      }
      return { lesson, score, matched };
    })
    .sort((a, b) => b.score - a.score || b.lesson.quality - a.lesson.quality);

  // Two shared words make a lesson on the topic; one is usually a coincidence.
  // When nothing shares two, the one-word matches are still candidates — the
  // client's model is the judge, and "nothing" hides lessons it might take.
  const strict = scored.filter(({ matched }) => matched >= needed);
  const kept = strict.length
    ? strict
    : scored.filter(({ matched }) => matched >= 1);
  return kept.slice(0, limit).map(({ lesson }) => lesson);
};
