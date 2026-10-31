import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ExerciseGoal } from "feature/exerciseGoals/types/exerciseGoal.types";
import { goalStages } from "feature/exerciseGoals/utils/goalRules";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import type { McpContext } from "../auth";
import {
  exerciseExists,
  exerciseTitle,
  logDay,
  readUser,
  resolveTimeZone,
  skillProgress,
  todayIn,
  userRef,
} from "../data";
import {
  appLink,
  errorResult,
  fittedResult,
  jsonResult,
  McpToolError,
  msToMinutes,
  pageInput,
  pageOf,
  READ_TOOL_ANNOTATIONS,
  runTool,
  strictInput,
} from "../results";

const DAY_MS = 24 * 60 * 60 * 1000;
/** The widest window one history read covers — a year of logs is a lot of reads. */
const MAX_HISTORY_DAYS = 92;
const CATEGORIES = ["technique", "theory", "hearing", "creativity"] as const;

const shiftDay = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);

/** A real calendar day — the regex alone lets 2026-02-31 through. */
const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine(
    (day) =>
      !Number.isNaN(Date.parse(`${day}T00:00:00Z`)) && shiftDay(day, 0) === day,
    "Not a real date",
  );

const timeZoneInput = z
  .string()
  .max(64)
  .optional()
  .describe("IANA zone, e.g. Europe/Warsaw; default: the profile's");

/**
 * Session logs on the player's days `from`…`to`, inclusive. Log ids are the
 * report's UTC ISO timestamp, so the read takes a day more on each side (no
 * zone is more than 14 h off UTC) and keeps the logs whose local day fits.
 */
async function readLogs(
  uid: string,
  from: string,
  to: string,
  timeZone: string,
) {
  const snapshot = await userRef(uid)
    .collection("exerciseData")
    .where(FieldPath.documentId(), ">=", `${shiftDay(from, -1)}T00:00:00`)
    .where(FieldPath.documentId(), "<=", `${shiftDay(to, 1)}T23:59:59.999Z`)
    .get();
  return snapshot.docs
    .map((doc) => ({
      ...(doc.data() as FirebaseUserExceriseLog),
      id: doc.id,
      day: logDay(doc.id, timeZone),
    }))
    .filter((log) => log.day >= from && log.day <= to);
}

type DayLog = Awaited<ReturnType<typeof readLogs>>[number];

/** The window a history tool reads, defaulting to the last `fallbackDays` of the player's days. */
const resolveRange = (
  from: string | undefined,
  to: string | undefined,
  fallbackDays: number,
  timeZone: string,
) => {
  const end = to ?? todayIn(timeZone);
  const start = from ?? shiftDay(end, -(fallbackDays - 1));
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

const sessionSummary = (log: DayLog) => {
  const time = log.timeSumary ?? ({} as FirebaseUserExceriseLog["timeSumary"]);
  const songs = log.songs?.length
    ? log.songs.map((song) => `${song.songArtist} — ${song.songTitle}`)
    : log.songTitle
      ? [`${log.songArtist ?? ""} — ${log.songTitle}`.trim()]
      : [];
  return {
    day: log.day,
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

export interface ScoredRun {
  at: number;
  bpm: number;
  accuracy: number;
  clean: boolean | null;
  mode: "goal" | "practice";
}

/**
 * Recent runs per exercise, as one line each: how many, the best tempo played
 * at 90%+ accuracy, the average accuracy and the latest run. Newest first.
 */
export function summarizeRuns(
  runsByExercise: {
    exerciseId: string;
    title: string | null;
    runs: ScoredRun[];
  }[],
  timeZone: string,
) {
  return runsByExercise
    .filter((entry) => entry.runs.length > 0)
    .map(({ exerciseId, title, runs }) => {
      const sorted = [...runs].sort((a, b) => b.at - a.at);
      const latest = sorted[0];
      const clean = runs.filter((run) => run.accuracy >= 90);
      return {
        exerciseId,
        title,
        runs: runs.length,
        lastDay: todayIn(timeZone, new Date(latest.at)),
        bestBpmAt90PercentAccuracy: clean.length
          ? Math.max(...clean.map((run) => run.bpm))
          : null,
        averageAccuracy: Math.round(
          runs.reduce((sum, run) => sum + run.accuracy, 0) / runs.length,
        ),
        latest: {
          at: new Date(latest.at).toISOString(),
          bpm: latest.bpm,
          accuracy: latest.accuracy,
          clean: latest.clean,
          mode: latest.mode,
        },
      };
    })
    .sort((a, b) => b.latest.at.localeCompare(a.latest.at));
}

/** How many exercises one recent-runs read looks into — each is one query. */
const MAX_RECENT_EXERCISES = 25;

const toMillis = (value: unknown) =>
  value && typeof (value as Timestamp).toMillis === "function"
    ? (value as Timestamp).toMillis()
    : typeof value === "number"
      ? value
      : 0;

export function registerProgressTools(server: McpServer, context: McpContext) {
  const { uid } = context;

  server.registerTool(
    "riffquest_get_profile_summary",
    {
      title: "Profile summary",
      description:
        "The player's profile: level, points, Fame, streak, time per category, sessions, song lists and their time zone.",
      inputSchema: strictInput({}),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    () =>
      runTool("riffquest_get_profile_summary", async () => {
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
          timeZone: resolveTimeZone(undefined, user),
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
    "riffquest_get_practice_history",
    {
      title: "Practice history",
      description: `Logged sessions between two of the player's days (inclusive, up to ${MAX_HISTORY_DAYS}, default the last 30), newest first: minutes per category, points, songs. A long range is cut to the newest sessions.`,
      inputSchema: strictInput({
        from: dateKey.optional(),
        to: dateKey.optional(),
        timeZone: timeZoneInput,
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ from, to, timeZone }) =>
      runTool("riffquest_get_practice_history", async () => {
        const zone = resolveTimeZone(timeZone, await readUser(uid));
        const range = resolveRange(from, to, 30, zone);
        const logs = await readLogs(uid, range.from, range.to, zone);
        const sessions = logs
          .map(sessionSummary)
          .sort((a, b) => b.at.localeCompare(a.at));
        const totals = {
          ...range,
          timeZone: zone,
          sessionCount: sessions.length,
          daysPracticed: new Set(sessions.map((s) => s.day)).size,
          totalMinutes: Math.round(
            sessions.reduce((sum, s) => sum + s.minutes, 0),
          ),
          totalPoints: sessions.reduce((sum, s) => sum + s.points, 0),
        };
        return fittedResult(
          (shown) => ({ ...totals, sessions: shown }),
          sessions,
          "Ask for the older sessions with an earlier `to`.",
        );
      }),
  );

  server.registerTool(
    "riffquest_get_calendar",
    {
      title: "Practice calendar",
      description:
        "Minutes practiced on each day of one month, in the player's own days.",
      inputSchema: strictInput({
        month: z
          .string()
          .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM")
          .optional()
          .describe("YYYY-MM, defaults to this month"),
        timeZone: timeZoneInput,
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ month, timeZone }) =>
      runTool("riffquest_get_calendar", async () => {
        const zone = resolveTimeZone(timeZone, await readUser(uid));
        const key = month ?? todayIn(zone).slice(0, 7);
        const [year, monthIndex] = key.split("-").map(Number);
        const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
        const logs = await readLogs(
          uid,
          `${key}-01`,
          `${key}-${String(lastDay).padStart(2, "0")}`,
          zone,
        );
        const days: Record<string, number> = {};
        for (let day = 1; day <= lastDay; day += 1) {
          days[`${key}-${String(day).padStart(2, "0")}`] = 0;
        }
        for (const log of logs) {
          if (log.day in days) days[log.day] += log.timeSumary?.sumTime ?? 0;
        }
        const entries = Object.entries(days).map(([day, ms]) => ({
          day,
          minutes: msToMinutes(ms),
        }));
        return jsonResult({
          month: key,
          timeZone: zone,
          daysPracticed: entries.filter((entry) => entry.minutes > 0).length,
          totalMinutes: Math.round(
            entries.reduce((sum, entry) => sum + entry.minutes, 0),
          ),
          days: entries,
        });
      }),
  );

  server.registerTool(
    "riffquest_get_skill_breakdown",
    {
      title: "Skill breakdown",
      description:
        "Every guitar skill with the player's points and minutes on it (minutes tracked since 2026-10-31), by category.",
      inputSchema: strictInput({}),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    () =>
      runTool("riffquest_get_skill_breakdown", async () => {
        const { points, timeSpent } = skillProgress(await readUser(uid));
        return jsonResult({
          categories: CATEGORIES.map((category) => ({
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
        });
      }),
  );

  server.registerTool(
    "riffquest_get_weak_spots",
    {
      title: "Weak spots",
      description:
        "Neglect data: per category, minutes in the last 30 days and days since last practiced; the skills with the least time and points.",
      inputSchema: strictInput({ timeZone: timeZoneInput }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ timeZone }) =>
      runTool("riffquest_get_weak_spots", async () => {
        const user = await readUser(uid);
        const zone = resolveTimeZone(timeZone, user);
        const range = resolveRange(undefined, undefined, 30, zone);
        const logs = await readLogs(uid, range.from, range.to, zone);
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
            .map((log) => log.day)
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

        const { points, timeSpent } = skillProgress(user);
        const leastPracticedSkills = guitarSkills
          .map((skill) => ({
            id: skill.id,
            category: skill.category,
            points: points[skill.id] ?? 0,
            minutes: msToMinutes(timeSpent[skill.id]),
          }))
          .sort((a, b) => a.minutes - b.minutes || a.points - b.points)
          .slice(0, 8);

        return jsonResult({
          window: { ...range, timeZone: zone },
          categories,
          leastPracticedSkills,
        });
      }),
  );

  server.registerTool(
    "riffquest_get_goals",
    {
      title: "Tempo goals",
      description:
        "The player's tempo goals, newest first: target BPM, current milestone and clean runs at it (3 clear a milestone). Paged.",
      inputSchema: strictInput({
        includeCompleted: z.boolean().optional(),
        ...pageInput(20, 50),
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ includeCompleted, offset, limit }) =>
      runTool("riffquest_get_goals", async () => {
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
        const page = pageOf(goals, offset, limit ?? 20);
        return jsonResult({
          ...page.meta,
          goals: page.items.map(goalSummary),
          goalsUrl: appLink("/goals"),
        });
      }),
  );

  server.registerTool(
    "riffquest_get_exercise_stats",
    {
      title: "Exercise stats",
      description:
        "The player's scored runs of one exercise (newest last, default 40): tempo, accuracy and timing.",
      inputSchema: strictInput({
        exerciseId: z.string().min(1).max(120),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("How many of the newest runs (default 40)"),
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ exerciseId, limit }) =>
      runTool("riffquest_get_exercise_stats", async () => {
        const snapshot = await userRef(uid)
          .collection("exerciseRuns")
          .doc(exerciseId)
          .collection("runs")
          .orderBy("createdAt", "desc")
          .limit(limit ?? 40)
          .get();
        // No runs is either "never played" or a wrong id — say which.
        if (snapshot.empty && !(await exerciseExists(uid, exerciseId))) {
          return errorResult(
            `No exercise "${exerciseId}". Find ids with riffquest_list_exercises or riffquest_get_my_exercises.`,
          );
        }
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

  server.registerTool(
    "riffquest_get_recent_runs",
    {
      title: "Recent scored runs",
      description:
        "Scored runs across all exercises over the player's last days (1 = today, default 7), one line per exercise: runs, best tempo at 90%+ accuracy, average accuracy, latest run.",
      inputSchema: strictInput({
        days: z.number().int().min(1).max(30).optional(),
        timeZone: timeZoneInput,
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ days, timeZone }) =>
      runTool("riffquest_get_recent_runs", async () => {
        const zone = resolveTimeZone(timeZone, await readUser(uid));
        const to = todayIn(zone);
        const from = shiftDay(to, -((days ?? 7) - 1));
        // No zone is more than 14 h ahead of UTC; the local day trims the rest.
        const since = Date.parse(`${from}T00:00:00Z`) - 14 * 60 * 60 * 1000;

        // Runs sit under each exercise, so first find which exercises were
        // played: the session report stamps every one in the rotation doc,
        // and goal runs belong to the open goals.
        const [rotation, goals] = await Promise.all([
          userRef(uid).collection("settings").doc("rotation").get(),
          userRef(uid).collection("exerciseGoals").get(),
        ]);
        const stamped = Object.entries(
          (rotation.data()?.lastPracticed?.exercise ?? {}) as Record<
            string,
            number
          >,
        )
          .filter(([, at]) => typeof at === "number" && at >= since)
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id);
        const goalIds = goals.docs
          .filter((goal) => goal.data().status !== "completed")
          .map((goal) => goal.data().exerciseId as string);
        const ids = Array.from(new Set([...stamped, ...goalIds])).slice(
          0,
          MAX_RECENT_EXERCISES,
        );

        const perExercise = await Promise.all(
          ids.map(async (exerciseId) => {
            const snapshot = await userRef(uid)
              .collection("exerciseRuns")
              .doc(exerciseId)
              .collection("runs")
              .where("createdAt", ">=", Timestamp.fromMillis(since))
              .orderBy("createdAt", "desc")
              .limit(50)
              .get();
            const runs = snapshot.docs
              .map((doc): ScoredRun => {
                const data = doc.data();
                return {
                  at: toMillis(data.createdAt),
                  bpm: data.bpm,
                  accuracy: data.accuracy,
                  clean: typeof data.clean === "boolean" ? data.clean : null,
                  mode: data.source === "goal" ? "goal" : "practice",
                };
              })
              .filter((run) => todayIn(zone, new Date(run.at)) >= from);
            return {
              exerciseId,
              title: runs.length ? await exerciseTitle(exerciseId) : null,
              runs,
            };
          }),
        );
        const exercises = summarizeRuns(perExercise, zone);
        return jsonResult({
          from,
          to,
          timeZone: zone,
          runCount: exercises.reduce((sum, entry) => sum + entry.runs, 0),
          exercises,
        });
      }),
  );
}
