import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CHALLENGE_SONG_COUNT } from "feature/challenges/types/challenge.types";
import { currentChallengeId } from "feature/challenges/utils/challengeMonth";
import {
  getDailyDayKey,
  getDailyExercise,
} from "feature/dailyExercise/utils/dailyExercise";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import fs from "fs";
import matter from "gray-matter";
import { EXERCISE_CATALOG } from "lib/roadmaps/generation/exerciseCatalog";
import path from "path";
import { z } from "zod";

import type { McpContext } from "../auth";
import { firestore } from "../db";
import {
  appLink,
  errorResult,
  jsonResult,
  msToMinutes,
  runTool,
} from "../results";

const exercisesById = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);

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

const songSummary = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  title: data.title,
  artist: data.artist,
  difficulty:
    typeof data.avgDifficulty === "number"
      ? Math.round(data.avgDifficulty * 10) / 10
      : null,
  tier: data.tier ?? null,
  genres: data.genres ?? [],
  popularity: data.popularity ?? 0,
  url: appLink(`/songs?songId=${encodeURIComponent(id)}`),
});

const WIKI_DIR = path.join(process.cwd(), "src/content/wiki");

interface WikiDoc {
  slug: string;
  title: string;
  section: string;
  description: string;
  text: string;
}

let wikiCache: WikiDoc[] | null = null;

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
        // Wiki components carry their words in props; the tags themselves are noise.
        text: content
          .replace(/<\/?[A-Z][^>]*>/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
      };
    })
    .filter((doc) => doc.slug && doc.title);
  return wikiCache;
};

export function registerCatalogTools(server: McpServer, context: McpContext) {
  server.registerTool(
    "list_exercise_taxonomy",
    {
      title: "Exercise taxonomy",
      description:
        "The categories, difficulty levels and guitar skill ids exercises use — the values list_exercises and create_exercise accept.",
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool("list_exercise_taxonomy", async () =>
        jsonResult({
          categories: EXERCISE_CATEGORIES,
          difficulties: EXERCISE_DIFFICULTIES,
          skills: guitarSkills.map((skill) => ({
            id: skill.id,
            category: skill.category,
          })),
        }),
      ),
  );

  server.registerTool(
    "list_exercises",
    {
      title: "Find exercises",
      description:
        "Searches the riff.quest exercise library (English titles and descriptions). All filters are optional and combine; `text` matches every word. Returns short entries; get_exercise has the full details.",
      inputSchema: {
        text: z.string().max(100).optional(),
        skill: z.enum(SKILL_IDS).optional(),
        category: z.enum(EXERCISE_CATEGORIES).optional(),
        difficulty: z.enum(EXERCISE_DIFFICULTIES).optional(),
        withTabOnly: z
          .boolean()
          .optional()
          .describe("Only exercises with a tab the mic scores"),
        limit: z.number().int().min(1).max(50).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    ({ text, skill, category, difficulty, withTabOnly, limit }) =>
      runTool("list_exercises", async () => {
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
        return jsonResult({
          total: matches.length,
          exercises: matches.slice(0, limit ?? 20).map((entry) => ({
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
    "get_exercise",
    {
      title: "Exercise details",
      description:
        "One library exercise: description, instructions, tips, BPM range, skills and a link that opens it in the app.",
      inputSchema: { id: z.string().min(1).max(120) },
      annotations: { readOnlyHint: true },
    },
    ({ id }) =>
      runTool("get_exercise", async () => {
        const exercise = exercisesById.get(id);
        if (!exercise)
          return errorResult(
            `No library exercise "${id}". Find ids with list_exercises; your own exercises are in get_my_exercises.`,
          );
        return jsonResult(exerciseDetails(exercise));
      }),
  );

  server.registerTool(
    "list_songs",
    {
      title: "Find songs",
      description:
        "Searches the song library by the start of a title or artist name. Without `text` it returns the most popular songs. Difficulty is the players' average rating, 1–10.",
      inputSchema: {
        text: z.string().max(80).optional(),
        maxDifficulty: z.number().min(1).max(10).optional(),
        limit: z.number().int().min(1).max(30).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    ({ text, maxDifficulty, limit }) =>
      runTool("list_songs", async () => {
        const songs = firestore.collection("songs");
        const size = limit ?? 15;
        const query = text?.trim().toLowerCase();
        const snapshots = query
          ? await Promise.all(
              (["title_lowercase", "artist_lowercase"] as const).map((field) =>
                songs
                  .where(field, ">=", query)
                  .where(field, "<=", `${query}`)
                  .limit(size)
                  .get(),
              ),
            )
          : [
              await songs
                .orderBy("popularity", "desc")
                .limit(size * 2)
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
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, size);
        return jsonResult({ songs: results });
      }),
  );

  server.registerTool(
    "get_song",
    {
      title: "Song details",
      description:
        "One song from the library, with the player's own status for it (wantToLearn / learning / learned) and how long they have practiced it.",
      inputSchema: { id: z.string().min(1).max(120) },
      annotations: { readOnlyHint: true },
    },
    ({ id }) =>
      runTool("get_song", async () => {
        const user = firestore.collection("users").doc(context.uid);
        const [song, status, progress] = await Promise.all([
          firestore.collection("songs").doc(id).get(),
          user.collection("userSongs").doc(id).get(),
          user.collection("songProgress").doc(id).get(),
        ]);
        if (!song.exists)
          return errorResult(`No song "${id}". Find ids with list_songs.`);
        return jsonResult({
          ...songSummary(song.id, song.data()!),
          yourStatus: status.data()?.status ?? null,
          yourPracticeMinutes: msToMinutes(progress.data()?.totalPracticeMs),
        });
      }),
  );

  server.registerTool(
    "get_daily_exercise",
    {
      title: "Exercise of the day",
      description:
        "Today's exercise of the day — the same one for every player, changing at midnight UTC.",
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool("get_daily_exercise", async () => {
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
    "get_monthly_challenge",
    {
      title: "Monthly challenge",
      description: `This month's challenge: the ${CHALLENGE_SONG_COUNT} songs the community voted for. Players record themselves playing them.`,
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool("get_monthly_challenge", async () => {
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
              difficulty: song.avgDifficulty ?? null,
            }),
          ),
          url: appLink("/challenges"),
        });
      }),
  );

  server.registerTool(
    "search_wiki",
    {
      title: "Search the wiki",
      description:
        "Searches the riff.quest player wiki — how points, Fame, streaks, goals, modes and other app mechanics work. Returns the best-matching articles with links, and the full text of the top one on request.",
      inputSchema: {
        text: z.string().min(2).max(100),
        full: z
          .boolean()
          .optional()
          .describe("Return the whole text of the best match"),
      },
      annotations: { readOnlyHint: true },
    },
    ({ text, full }) =>
      runTool("search_wiki", async () => {
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
        return jsonResult(
          scored.map(({ doc }, index) => ({
            title: doc.title,
            section: doc.section,
            description: doc.description,
            url: appLink(`/wiki/${doc.slug}`),
            ...(full && index === 0 ? { text: doc.text.slice(0, 12_000) } : {}),
          })),
        );
      }),
  );
}
