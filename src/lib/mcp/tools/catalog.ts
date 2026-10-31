import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CHALLENGE_SONG_COUNT } from "feature/challenges/types/challenge.types";
import { currentChallengeId } from "feature/challenges/utils/challengeMonth";
import {
  getDailyDayKey,
  getDailyExercise,
} from "feature/dailyExercise/utils/dailyExercise";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import fs from "fs";
import matter from "gray-matter";
import { EXERCISE_CATALOG } from "lib/roadmaps/generation/exerciseCatalog";
import path from "path";
import { z } from "zod";

import type { McpContext } from "../auth";
import { exercisesById, userRef } from "../data";
import { firestore } from "../db";
import {
  appLink,
  errorResult,
  jsonResult,
  msToMinutes,
  pageInput,
  pageOf,
  READ_TOOL_ANNOTATIONS,
  runTool,
  strictInput,
} from "../results";

export const EXERCISE_CATEGORIES = [
  "technique",
  "theory",
  "hearing",
  "creativity",
  "mixed",
] as const;
export const EXERCISE_DIFFICULTIES = [
  "beginner",
  "easy",
  "medium",
  "hard",
] as const;
export const SKILL_IDS = guitarSkills.map((skill) => skill.id) as [
  string,
  ...string[],
];

/** Where the app opens a library exercise straight into a session. */
export const exerciseLink = (id: string) =>
  appLink(`/profile/skills?exerciseId=${encodeURIComponent(id)}`);

const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Every word of the query somewhere in the text — plain matching, no model. */
const matchesText = (haystack: string, query: string) => {
  const text = normalize(haystack);
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
};

/** What exerciseDetails returns — the output schema of the tools that answer with it. */
export const exerciseDetailsShape = {
  id: z.string(),
  title: z.string(),
  description: z.string(),
  whyItMatters: z.string().nullable(),
  category: z.string(),
  difficulty: z.string(),
  skills: z.array(z.string()),
  minutes: z.number(),
  bpm: z
    .object({ min: z.number(), max: z.number(), recommended: z.number() })
    .nullable()
    .describe("null: played without a metronome"),
  instructions: z.array(z.string()),
  tips: z.array(z.string()),
  hasTab: z.boolean(),
  tabMeasures: z.number(),
  scoredByMic: z.boolean(),
  url: z.string(),
};

/** A library exercise as the model reads it, without the tab itself. */
export const exerciseDetails = (exercise: Exercise) => ({
  id: exercise.id,
  title: exercise.title,
  description: exercise.description,
  whyItMatters: exercise.whyItMatters ?? null,
  category: exercise.category,
  difficulty: exercise.difficulty,
  skills: exercise.relatedSkills ?? [],
  minutes: exercise.timeInMinutes,
  bpm: exercise.metronomeSpeed ?? null,
  instructions: exercise.instructions ?? [],
  tips: exercise.tips ?? [],
  hasTab: !!exercise.tablature?.length,
  tabMeasures: exercise.tablature?.length ?? 0,
  scoredByMic: !!exercise.tablature?.length && !exercise.disableMic,
  url: exerciseLink(exercise.id),
});

const pageMeta = {
  total: z.number(),
  count: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
  nextOffset: z.number().optional(),
};

const songSummary = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  title: data.title,
  artist: data.artist,
  // 0 is "nobody rated it yet", not "trivial".
  difficulty:
    typeof data.avgDifficulty === "number" && data.avgDifficulty > 0
      ? Math.round(data.avgDifficulty * 10) / 10
      : null,
  tier: data.tier ?? null,
  genres: data.genres ?? [],
  popularity: data.popularity ?? 0,
  url: appLink(`/songs?songId=${encodeURIComponent(id)}`),
});

/** The deepest a song search pages — each page reads every song it skips. */
const MAX_SONG_OFFSET = 150;

const WIKI_DIR = path.join(process.cwd(), "src/content/wiki");

interface WikiDoc {
  slug: string;
  title: string;
  section: string;
  description: string;
  text: string;
}

let wikiCache: WikiDoc[] | null = null;

const COMPONENT_TAG =
  /<\/?[A-Z][\w.]*((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*)\s*\/?>/g;

/** Component props that are wiring, not words: video ids, image paths, styling, links. */
const NON_TEXT_PROPS = new Set([
  "id",
  "src",
  "href",
  "type",
  "links",
  "highlight",
  "maxWidth",
]);

/**
 * The words of one wiki component (`<ProgressLadder items="Day 2::+20%|…" />`):
 * its attribute values, with `a::b|c::d` lists as lines. The facts players
 * ask about — streak bonuses, FAQ answers — live in these props.
 */
export const componentText = (attributes: string) =>
  Array.from(
    attributes.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)')/g),
    ([, name, double, single]) =>
      NON_TEXT_PROPS.has(name) ? "" : (double ?? single),
  )
    .filter(Boolean)
    .map((value) =>
      value.includes("|") || value.includes("::")
        ? value
            .split("|")
            .map((item) => `- ${item.split("::").join(": ")}`)
            .join("\n")
        : value,
    )
    .join("\n");

/** A wiki article as plain text, its components flattened into their words. */
export const wikiPlainText = (content: string) =>
  content
    .replace(COMPONENT_TAG, (_, attributes: string) =>
      attributes ? `\n${componentText(attributes)}\n` : " ",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** The English articles as plain text — read once per server instance. */
const loadWiki = (): WikiDoc[] => {
  if (wikiCache) return wikiCache;
  if (!fs.existsSync(WIKI_DIR)) return (wikiCache = []);
  wikiCache = fs
    .readdirSync(WIKI_DIR)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => {
      const { data, content } = matter(
        fs.readFileSync(path.join(WIKI_DIR, file), "utf-8"),
      );
      return {
        slug: data.slug as string,
        title: data.title as string,
        section: data.section as string,
        description: (data.description as string) ?? "",
        text: wikiPlainText(content),
      };
    })
    .filter((doc) => doc.slug && doc.title);
  return wikiCache;
};

export function registerCatalogTools(server: McpServer, context: McpContext) {
  server.registerTool(
    "riffquest_list_exercise_taxonomy",
    {
      title: "Exercise taxonomy",
      description: "The category, difficulty and skill ids exercises use.",
      inputSchema: strictInput({}),
      outputSchema: {
        categories: z.array(z.string()),
        difficulties: z.array(z.string()),
        skills: z.array(z.object({ id: z.string(), category: z.string() })),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    () =>
      runTool("riffquest_list_exercise_taxonomy", async () =>
        jsonResult({
          categories: [...EXERCISE_CATEGORIES],
          difficulties: [...EXERCISE_DIFFICULTIES],
          skills: guitarSkills.map((skill) => ({
            id: skill.id,
            category: skill.category,
          })),
        }),
      ),
  );

  server.registerTool(
    "riffquest_list_exercises",
    {
      title: "Find exercises",
      description:
        "Searches the exercise library (English). Filters combine; `text` matches every word. Short entries, paged; riffquest_get_exercise has the details.",
      inputSchema: strictInput({
        text: z.string().max(100).optional(),
        skill: z.enum(SKILL_IDS).optional(),
        category: z.enum(EXERCISE_CATEGORIES).optional(),
        difficulty: z.enum(EXERCISE_DIFFICULTIES).optional(),
        withTabOnly: z
          .boolean()
          .optional()
          .describe("Only exercises with a tab the mic scores"),
        ...pageInput(20, 50),
      }),
      outputSchema: {
        ...pageMeta,
        exercises: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            category: z.string(),
            difficulty: z.string(),
            kind: z.string(),
            skills: z.array(z.string()),
            minutes: z.number().nullable(),
          }),
        ),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ text, skill, category, difficulty, withTabOnly, offset, limit }) =>
      runTool("riffquest_list_exercises", async () => {
        const matches = EXERCISE_CATALOG.filter(
          (entry) =>
            (!skill || entry.skills.includes(skill)) &&
            (!category || entry.category === category) &&
            (!difficulty || entry.difficulty === difficulty) &&
            (!withTabOnly ||
              !!exercisesById.get(entry.id)?.tablature?.length) &&
            (!text ||
              matchesText(
                `${entry.id} ${entry.title} ${entry.description} ${entry.skills.join(" ")}`,
                text,
              )),
        );
        const page = pageOf(matches, offset, limit ?? 20);
        return jsonResult({
          ...page.meta,
          exercises: page.items.map((entry) => ({
            id: entry.id,
            title: entry.title,
            category: entry.category,
            difficulty: entry.difficulty,
            kind: entry.kind,
            skills: entry.skills,
            minutes: exercisesById.get(entry.id)?.timeInMinutes ?? null,
          })),
        });
      }),
  );

  server.registerTool(
    "riffquest_get_exercise",
    {
      title: "Exercise details",
      description:
        "One library exercise: description, instructions, tips, BPM range, skills and a link.",
      inputSchema: strictInput({ id: z.string().min(1).max(120) }),
      outputSchema: exerciseDetailsShape,
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ id }) =>
      runTool("riffquest_get_exercise", async () => {
        const exercise = exercisesById.get(id);
        if (!exercise)
          return errorResult(
            `No library exercise "${id}". Find ids with riffquest_list_exercises; your own exercises are in riffquest_get_my_exercises.`,
          );
        return jsonResult(exerciseDetails(exercise));
      }),
  );

  server.registerTool(
    "riffquest_list_songs",
    {
      title: "Find songs",
      description:
        "Searches the song library by the start of a title or artist (\"metal\" finds Metallica; a word mid-title doesn't match). Without text: the most popular. Difficulty is the players' average, 1–10. Paged.",
      inputSchema: strictInput({
        text: z.string().max(80).optional(),
        maxDifficulty: z.number().min(1).max(10).optional(),
        offset: z
          .number()
          .int()
          .min(0)
          .max(MAX_SONG_OFFSET)
          .optional()
          .describe("How many songs to skip, for the next page (default 0)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("Songs per page (default 15)"),
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ text, maxDifficulty, offset, limit }) =>
      runTool("riffquest_list_songs", async () => {
        const songs = firestore.collection("songs");
        const size = limit ?? 15;
        // Firestore can't skip without reading — every page reads what it skips.
        const window = (offset ?? 0) + size;
        const query = text?.trim().toLowerCase();
        const snapshots = query
          ? await Promise.all(
              (["title_lowercase", "artist_lowercase"] as const).map((field) =>
                songs
                  .where(field, ">=", query)
                  .where(field, "<=", `${query}`)
                  .limit(window)
                  .get(),
              ),
            )
          : [
              await songs
                .orderBy("popularity", "desc")
                .limit(window * 2)
                .get(),
            ];

        const seen = new Map<string, ReturnType<typeof songSummary>>();
        for (const snapshot of snapshots) {
          for (const doc of snapshot.docs)
            seen.set(doc.id, songSummary(doc.id, doc.data()));
        }
        const results = Array.from(seen.values())
          .filter(
            (song) =>
              !maxDifficulty ||
              (song.difficulty !== null && song.difficulty <= maxDifficulty),
          )
          .sort((a, b) => b.popularity - a.popularity);
        // Only a window of the library is read, so there's no total to give —
        // just whether a query filled its window (more songs past it).
        const {
          items,
          meta: { total: _readOnly, ...meta },
        } = pageOf(results, offset, size);
        const filled = snapshots.some(
          (snapshot) => snapshot.size >= (query ? window : window * 2),
        );
        const hasMore = meta.hasMore || filled;
        return jsonResult({
          ...meta,
          hasMore,
          ...(hasMore ? { nextOffset: meta.offset + items.length } : {}),
          songs: items,
        });
      }),
  );

  server.registerTool(
    "riffquest_get_song",
    {
      title: "Song details",
      description:
        "One song, with the player's status for it and their practice time on it.",
      inputSchema: strictInput({ id: z.string().min(1).max(120) }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ id }) =>
      runTool("riffquest_get_song", async () => {
        const user = userRef(context.uid);
        const [song, status, progress] = await Promise.all([
          firestore.collection("songs").doc(id).get(),
          user.collection("userSongs").doc(id).get(),
          user.collection("songProgress").doc(id).get(),
        ]);
        if (!song.exists)
          return errorResult(
            `No song "${id}". Find ids with riffquest_list_songs.`,
          );
        return jsonResult({
          ...songSummary(song.id, song.data()!),
          yourStatus: status.data()?.status ?? null,
          yourPracticeMinutes: msToMinutes(progress.data()?.totalPracticeMs),
        });
      }),
  );

  server.registerTool(
    "riffquest_get_daily_exercise",
    {
      title: "Exercise of the day",
      description:
        "Today's exercise of the day — the same for everyone, changing at midnight UTC.",
      inputSchema: strictInput({}),
      // Same shape as get_exercise's — declared once there, to keep the list short.
      annotations: READ_TOOL_ANNOTATIONS,
    },
    () =>
      runTool("riffquest_get_daily_exercise", async () => {
        const day = getDailyDayKey();
        const exercise = getDailyExercise(day);
        if (!exercise) return errorResult("No exercise of the day today.");
        return jsonResult({
          day,
          ...exerciseDetails(exercise),
          boardUrl: appLink("/dashboard"),
        });
      }),
  );

  server.registerTool(
    "riffquest_get_monthly_challenge",
    {
      title: "Monthly challenge",
      description: `This month's challenge: the ${CHALLENGE_SONG_COUNT} songs the community voted for.`,
      inputSchema: strictInput({}),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    () =>
      runTool("riffquest_get_monthly_challenge", async () => {
        const id = currentChallengeId();
        const doc = await firestore.collection("challenges").doc(id).get();
        if (!doc.exists)
          return errorResult(`The ${id} challenge hasn't been drawn yet.`);
        const data = doc.data()!;
        return jsonResult({
          month: id,
          title: data.title,
          endsAt: data.endsAt?.toDate?.().toISOString() ?? null,
          songs: (data.songs ?? []).map(
            (song: {
              songId: string;
              title: string;
              artist: string;
              avgDifficulty?: number;
            }) => ({
              id: song.songId,
              title: song.title,
              artist: song.artist,
              // 0 is "nobody rated it yet", not "trivial".
              difficulty: song.avgDifficulty || null,
            }),
          ),
          url: appLink("/challenges"),
        });
      }),
  );

  server.registerTool(
    "riffquest_search_wiki",
    {
      title: "Search the wiki",
      description:
        "Searches the player wiki on how the app works (points, Fame, streaks, goals, modes): best matches with links; `full` adds the top article's text.",
      inputSchema: strictInput({
        text: z.string().min(2).max(100),
        full: z
          .boolean()
          .optional()
          .describe("Return the whole text of the best match"),
      }),
      outputSchema: {
        results: z.array(
          z.object({
            title: z.string(),
            section: z.string(),
            description: z.string(),
            url: z.string(),
            text: z.string().optional(),
          }),
        ),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ text, full }) =>
      runTool("riffquest_search_wiki", async () => {
        const words = normalize(text).split(/\s+/).filter(Boolean);
        const scored = loadWiki()
          .map((doc) => {
            const title = normalize(doc.title);
            const body = normalize(`${doc.description} ${doc.text}`);
            const score = words.reduce(
              (sum, word) =>
                sum +
                (title.includes(word) ? 5 : 0) +
                (body.split(word).length - 1),
              0,
            );
            return { doc, score };
          })
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        if (scored.length === 0)
          return errorResult(`Nothing in the wiki matches "${text}".`);
        return jsonResult({
          results: scored.map(({ doc }, index) => ({
            title: doc.title,
            section: doc.section ?? "",
            description: doc.description,
            url: appLink(`/wiki/${doc.slug}`),
            ...(full && index === 0 ? { text: doc.text.slice(0, 12_000) } : {}),
          })),
        });
      }),
  );
}
