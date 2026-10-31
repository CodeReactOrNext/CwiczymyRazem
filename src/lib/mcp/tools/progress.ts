import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ExerciseGoal } from "feature/exerciseGoals/types/exerciseGoal.types";
import { goalStages } from "feature/exerciseGoals/utils/goalRules";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { FieldPath, type Timestamp } from "firebase-admin/firestore";
import type { StatisticsDataInterface } from "types/api.types";
import { z } from "zod";

import type { McpContext } from "../auth";
import { firestore } from "../db";
import {
  appLink,
  jsonResult,
  McpToolError,
  msToMinutes,
  runTool,
} from "../results";

const DAY_MS = 24 * 60 * 60 * 1000;
/** The widest window one history read covers — a year of logs is a lot of reads. */
const MAX_HISTORY_DAYS = 92;
const CATEGORIES = ["technique", "theory", "hearing", "creativity"] as const;

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const userRef = (uid: string) => firestore.collection("users").doc(uid);

async function readUser(uid: string) {
  const data = (await userRef(uid).get()).data();
  if (!data) throw new McpToolError("No riff.quest profile for this token.");
  return data as {
    displayName?: string;
    statistics?: StatisticsDataInterface;
    skills?: {
      unlockedSkills?: Record<string, number>;
      timeSpent?: Record<string, number>;
    };
  };
}

/**
 * Session logs between two days, inclusive. Log ids are the report's ISO
 * timestamp, so a day range is a range over document ids.
 */
async function readLogs(uid: string, from: string, to: string) {
  const snapshot = await userRef(uid)
    .collection("exerciseData")
    .where(FieldPath.documentId(), ">=", `${from}T00:00:00`)
    .where(FieldPath.documentId(), "<=", `${to}T23:59:59.999Z`)
    .get();
  return snapshot.docs.map((doc) => ({
    ...(doc.data() as FirebaseUserExceriseLog),
    id: doc.id,
  }));
}

/** The window a history tool reads, defaulting to the last `fallbackDays`. */
const resolveRange = (
  from: string | undefined,
  to: string | undefined,
  fallbackDays: number,
) => {
  const end = to ?? new Date().toISOString().slice(0, 10);
  const start =
    from ??
    new Date(Date.parse(end) - (fallbackDays - 1) * DAY_MS)
      .toISOString()
      .slice(0, 10);
  const span = (Date.parse(end) - Date.parse(start)) / DAY_MS + 1;
  if (!(span >= 1))
    throw new McpToolError("`from` has to be on or before `to`.");
  if (span > MAX_HISTORY_DAYS) {
    throw new McpToolError(
      `At most ${MAX_HISTORY_DAYS} days per call — split the range.`,
    );
  }
  return { from: start, to: end };
};

const sessionSummary = (log: FirebaseUserExceriseLog & { id: string }) => {
  const time = log.timeSumary ?? ({} as FirebaseUserExceriseLog["timeSumary"]);
  const songs = log.songs?.length
    ? log.songs.map((song) => `${song.songArtist} — ${song.songTitle}`)
    : log.songTitle
      ? [`${log.songArtist ?? ""} — ${log.songTitle}`.trim()]
      : [];
  return {
    at: log.id,
    title: log.exceriseTitle || null,
    minutes: msToMinutes(time.sumTime),
    byCategory: {
      technique: msToMinutes(time.techniqueTime),
      theory: msToMinutes(time.theoryTime),
      hearing: msToMinutes(time.hearingTime),
      creativity: msToMinutes(time.creativityTime),
    },
    points: log.totalPoints ?? 0,
    songs,
    ...(log.description ? { note: log.description.slice(0, 300) } : {}),
  };
};

const goalSummary = (goal: ExerciseGoal) => {
  const stages = goalStages(goal);
  return {
    id: goal.id,
    exerciseId: goal.exerciseId,
    exercise: goal.exerciseTitle,
    status: goal.status,
    targetBpm: goal.targetBpm,
    currentMilestoneBpm: goal.stageBpm,
    milestone: `${Math.max(1, stages.indexOf(goal.stageBpm) + 1)}/${stages.length}`,
    milestones: stages,
    cleanRunsAtMilestone: goal.cleanRuns,
    strictness: goal.strictness,
    counting: goal.counting,
  };
};

const toMillis = (value: unknown) =>
  value && typeof (value as Timestamp).toMillis === "function"
    ? (value as Timestamp).toMillis()
    : typeof value === "number"
      ? value
      : 0;

export function registerProgressTools(server: McpServer, context: McpContext) {
  const { uid } = context;

  server.registerTool(
    "get_profile_summary",
    {
      title: "Profile summary",
      description:
        "The player's riff.quest profile at a glance: level, points, Fame, streak, total practice time per category, session count and song lists.",
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool("get_profile_summary", async () => {
        const user = await readUser(uid);
        const stats = user.statistics;
        const time = stats?.time;
        return jsonResult({
          name: user.displayName ?? null,
          level: stats?.lvl ?? 1,
          points: stats?.points ?? 0,
          pointsToNextLevel: Math.max(
            0,
            (stats?.currentLevelMaxPoints ?? 0) - (stats?.points ?? 0),
          ),
          fame: stats?.fame ?? 0,
          streakDays: stats?.streakDays ?? stats?.actualDayWithoutBreak ?? 0,
          longestStreakDays: stats?.dayWithoutBreak ?? 0,
          restDaysEnabled: stats?.streakRestDays !== false,
          lastPracticeDay: stats?.lastPracticeLocalDay ?? null,
          sessions: stats?.sessionCount ?? 0,
          totalMinutesByCategory: {
            technique: msToMinutes(time?.technique),
            theory: msToMinutes(time?.theory),
            hearing: msToMinutes(time?.hearing),
            creativity: msToMinutes(time?.creativity),
          },
          longestSessionMinutes: msToMinutes(time?.longestSession),
          playingSince: stats?.guitarStartDate
            ? new Date(toMillis(stats.guitarStartDate))
                .toISOString()
                .slice(0, 10)
            : null,
          songCounts: {
            wantToLearn: stats?.songLists?.wantToLearn?.length ?? 0,
            learning: stats?.songLists?.learning?.length ?? 0,
            learned: stats?.songLists?.learned?.length ?? 0,
          },
          profileUrl: appLink(`/user/${uid}`),
        });
      }),
  );

  server.registerTool(
    "get_practice_history",
    {
      title: "Practice history",
      description: `The player's logged practice sessions between two days (inclusive, at most ${MAX_HISTORY_DAYS} days per call; defaults to the last 30). Each session has its minutes per category, points and the songs played.`,
      inputSchema: { from: dateKey.optional(), to: dateKey.optional() },
      annotations: { readOnlyHint: true },
    },
    ({ from, to }) =>
      runTool("get_practice_history", async () => {
        const range = resolveRange(from, to, 30);
        const logs = await readLogs(uid, range.from, range.to);
        const sessions = logs
          .map(sessionSummary)
          .sort((a, b) => a.at.localeCompare(b.at));
        return jsonResult({
          ...range,
          sessionCount: sessions.length,
          totalMinutes: Math.round(
            sessions.reduce((sum, s) => sum + s.minutes, 0),
          ),
          sessions,
        });
      }),
  );

  server.registerTool(
    "get_calendar",
    {
      title: "Practice calendar",
      description:
        "Minutes practiced per day for one month — which days the player practiced and which they skipped. Days are UTC dates of the logged sessions.",
      inputSchema: {
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM")
          .optional()
          .describe("YYYY-MM, defaults to this month"),
      },
      annotations: { readOnlyHint: true },
    },
    ({ month }) =>
      runTool("get_calendar", async () => {
        const key = month ?? new Date().toISOString().slice(0, 7);
        const [year, monthIndex] = key.split("-").map(Number);
        const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
        const logs = await readLogs(
          uid,
          `${key}-01`,
          `${key}-${String(lastDay).padStart(2, "0")}`,
        );
        const days: Record<string, number> = {};
        for (let day = 1; day <= lastDay; day += 1) {
          days[`${key}-${String(day).padStart(2, "0")}`] = 0;
        }
        for (const log of logs) {
          const day = log.id.slice(0, 10);
          if (day in days) days[day] += log.timeSumary?.sumTime ?? 0;
        }
        const entries = Object.entries(days).map(([day, ms]) => ({
          day,
          minutes: msToMinutes(ms),
        }));
        return jsonResult({
          month: key,
          daysPracticed: entries.filter((entry) => entry.minutes > 0).length,
          totalMinutes: Math.round(
            entries.reduce((sum, entry) => sum + entry.minutes, 0),
          ),
          days: entries,
        });
      }),
  );

  server.registerTool(
    "get_skill_breakdown",
    {
      title: "Skill breakdown",
      description:
        "Every guitar skill with the player's skill points and all-time minutes on it (minutes are tracked from 2026-10-31 on), grouped by category. Skills at 0 are ones the player hasn't worked on.",
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool("get_skill_breakdown", async () => {
        const user = await readUser(uid);
        const points =
          user.skills?.unlockedSkills ??
          user.statistics?.skills?.unlockedSkills ??
          {};
        const timeSpent =
          user.skills?.timeSpent ?? user.statistics?.skills?.timeSpent ?? {};
        return jsonResult(
          CATEGORIES.map((category) => ({
            category,
            skills: guitarSkills
              .filter((skill) => skill.category === category)
              .map((skill) => ({
                id: skill.id,
                points: points[skill.id] ?? 0,
                minutes: msToMinutes(timeSpent[skill.id]),
              }))
              .sort((a, b) => b.points - a.points || b.minutes - a.minutes),
          })),
        );
      }),
  );

  server.registerTool(
    "get_weak_spots",
    {
      title: "Weak spots",
      description:
        "Raw data for spotting neglect: per category, minutes in the last 30 days and days since it was last practiced; and the skills with the least time and points. Returns data only, no recommendation.",
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool("get_weak_spots", async () => {
        const range = resolveRange(undefined, undefined, 30);
        const [user, logs] = await Promise.all([
          readUser(uid),
          readLogs(uid, range.from, range.to),
        ]);
        const today = Date.parse(range.to);
        const timeKey = {
          technique: "techniqueTime",
          theory: "theoryTime",
          hearing: "hearingTime",
          creativity: "creativityTime",
        } as const;
        const categories = CATEGORIES.map((category) => {
          const touched = logs.filter(
            (log) => (log.timeSumary?.[timeKey[category]] ?? 0) > 0,
          );
          const last = touched
            .map((log) => log.id.slice(0, 10))
            .sort()
            .at(-1);
          return {
            category,
            minutesLast30Days: Math.round(
              touched.reduce(
                (sum, log) =>
                  sum + msToMinutes(log.timeSumary?.[timeKey[category]]),
                0,
              ),
            ),
            daysSinceLastPracticed: last
              ? Math.round((today - Date.parse(last)) / DAY_MS)
              : null,
          };
        }).sort((a, b) => a.minutesLast30Days - b.minutesLast30Days);

        const points = user.skills?.unlockedSkills ?? {};
        const timeSpent = user.skills?.timeSpent ?? {};
        const leastPracticedSkills = guitarSkills
          .map((skill) => ({
            id: skill.id,
            category: skill.category,
            points: points[skill.id] ?? 0,
            minutes: msToMinutes(timeSpent[skill.id]),
          }))
          .sort((a, b) => a.minutes - b.minutes || a.points - b.points)
          .slice(0, 8);

        return jsonResult({ window: range, categories, leastPracticedSkills });
      }),
  );

  server.registerTool(
    "get_goals",
    {
      title: "Tempo goals",
      description:
        "The player's tempo goals: target BPM per exercise, the milestone they are on and how many clean runs they have at it (3 clean runs clear a milestone).",
      inputSchema: { includeCompleted: z.boolean().optional() },
      annotations: { readOnlyHint: true },
    },
    ({ includeCompleted }) =>
      runTool("get_goals", async () => {
        const snapshot = await userRef(uid).collection("exerciseGoals").get();
        const goals = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const startBpm = data.startBpm ?? data.targetBpm;
            return {
              id: doc.id,
              exerciseId: data.exerciseId,
              exerciseTitle: data.exerciseTitle ?? "",
              targetBpm: data.targetBpm,
              startBpm,
              stepBpm: data.stepBpm ?? 5,
              stageBpm: data.stageBpm ?? startBpm,
              strictness: data.strictness ?? "standard",
              counting: data.counting ?? "streak",
              cleanRuns: data.cleanRuns ?? 0,
              status: data.status === "completed" ? "completed" : "active",
              createdAt: toMillis(data.createdAt),
              completedAt: data.completedAt ? toMillis(data.completedAt) : null,
            } satisfies ExerciseGoal;
          })
          .filter((goal) => includeCompleted || goal.status === "active")
          .sort((a, b) => b.createdAt - a.createdAt);
        return jsonResult({
          goals: goals.map(goalSummary),
          goalsUrl: appLink("/goals"),
        });
      }),
  );

  server.registerTool(
    "get_exercise_stats",
    {
      title: "Exercise stats",
      description:
        "The player's scored runs of one exercise (newest last, up to 40): tempo, accuracy and timing. Takes an exercise id as list_exercises and get_goals return it.",
      inputSchema: { exerciseId: z.string().min(1).max(120) },
      annotations: { readOnlyHint: true },
    },
    ({ exerciseId }) =>
      runTool("get_exercise_stats", async () => {
        const snapshot = await userRef(uid)
          .collection("exerciseRuns")
          .doc(exerciseId)
          .collection("runs")
          .orderBy("createdAt", "desc")
          .limit(40)
          .get();
        const runs = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              at: new Date(toMillis(data.createdAt)).toISOString(),
              bpm: data.bpm,
              accuracy: data.accuracy,
              mode: data.source === "goal" ? "goal" : "practice",
              clean: typeof data.clean === "boolean" ? data.clean : null,
              timingOffsetMs:
                typeof data.timingOffsetMs === "number"
                  ? Math.round(data.timingOffsetMs)
                  : null,
              timingBiasMs:
                typeof data.timingBiasMs === "number"
                  ? Math.round(data.timingBiasMs)
                  : null,
            };
          })
          .reverse();
        const best = runs
          .filter((run) => run.accuracy >= 90)
          .sort((a, b) => b.bpm - a.bpm)[0];
        return jsonResult({
          exerciseId,
          runCount: runs.length,
          bestBpmAt90PercentAccuracy: best?.bpm ?? null,
          runs,
        });
      }),
  );
}
