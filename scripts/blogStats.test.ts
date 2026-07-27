// @vitest-environment node

/**
 * One-off diagnostic script: pulls real aggregate stats from Firestore for use
 * in blog content (not wired into any generated app file, unlike
 * updateHeroStats.test.ts). Prints results to the console only.
 *
 * Computes:
 * - Average + median session length from `logs` (`timeSumary.sumTime`, ms).
 * - Longest practice streaks from `users.statistics.dayWithoutBreak` (the
 *   running max streak ever reached, updated in reportUpdateUserState.ts —
 *   distinct from `actualDayWithoutBreak`, the current live streak).
 * - % of users who ever reached a 7/14/30/60-day streak, for context around
 *   the top performers.
 *
 * Run with: npm run blog-stats
 * Guarded by `--mode blog-stats` so a plain `vitest`/`npm run test` skips it.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, it } from "vitest";

const readServiceAccountJson = (): string | undefined => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  }
  for (const file of [".env.development.local", ".env.local", ".env"]) {
    const envPath = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      if (!line.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON=")) continue;
      let value = line.slice("FIREBASE_SERVICE_ACCOUNT_JSON=".length).trim();
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }
      if (value) return value;
    }
  }
  return undefined;
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const isBlogStatsMode = (import.meta as any).env?.MODE === "blog-stats";

(isBlogStatsMode ? describe : describe.skip)("Blog stats", () => {
  it(
    "prints real session-length and streak stats from Firestore",
    async () => {
      const serviceAccountJson = readServiceAccountJson();
      if (!serviceAccountJson) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_JSON not found in process.env or project .env files",
        );
      }
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
        });
      }

      const firestore = admin.firestore();
      const { AggregateField } = admin.firestore;

      // --- Session length (average via aggregate, median via full fetch) ---
      const sessionsQuery = firestore
        .collection("logs")
        .where("timeSumary.sumTime", ">=", 0);

      const sessionsAggSnap = await sessionsQuery
        .aggregate({
          sessionCount: AggregateField.count(),
          totalMs: AggregateField.sum("timeSumary.sumTime"),
          avgMs: AggregateField.average("timeSumary.sumTime"),
        })
        .get();
      const { sessionCount, totalMs, avgMs } = sessionsAggSnap.data();

      const sessionsSnap = await sessionsQuery
        .select("timeSumary.sumTime", "songId", "planId")
        .get();
      const sessionMinutes = sessionsSnap.docs
        .map((doc) => doc.get("timeSumary.sumTime") as number)
        .filter((ms) => typeof ms === "number" && ms >= 0)
        .map((ms) => ms / (1000 * 60));
      const medianMinutes = median(sessionMinutes);
      const avgMinutes = (avgMs ?? 0) / (1000 * 60);

      console.log("[blog-stats] session length:", {
        sessionCount,
        totalHours: Math.round((totalMs ?? 0) / (1000 * 60 * 60)),
        avgMinutes: Math.round(avgMinutes * 10) / 10,
        medianMinutes: Math.round(medianMinutes * 10) / 10,
        sampledForMedian: sessionMinutes.length,
      });

      // --- Session "type" breakdown (mirrors getSessionType in
      // feature/practiceLog/utils/practiceLog.utils.ts: planId wins over
      // songId, otherwise "manual"). Answers "how much practice time is
      // logged playing songs vs. a structured plan vs. freeform" — NOT the
      // same thing as timeSumary.creativityTime, which is a skill-category
      // (composition/improvisation) unrelated to session type. ---
      const typeMs = { song: 0, plan: 0, manual: 0 };
      const typeCount = { song: 0, plan: 0, manual: 0 };
      let totalTypedMs = 0;
      for (const doc of sessionsSnap.docs) {
        const ms = doc.get("timeSumary.sumTime") as number;
        if (typeof ms !== "number" || ms < 0) continue;
        const planId = doc.get("planId");
        const songId = doc.get("songId");
        const type = planId ? "plan" : songId ? "song" : "manual";
        typeMs[type] += ms;
        typeCount[type] += 1;
        totalTypedMs += ms;
      }

      console.log("[blog-stats] session type breakdown (by time):", {
        totalTypedSessions: sessionsSnap.docs.length,
        percentOfTimeByType: Object.fromEntries(
          (Object.keys(typeMs) as (keyof typeof typeMs)[]).map((t) => [
            t,
            totalTypedMs
              ? Math.round((typeMs[t] / totalTypedMs) * 1000) / 10
              : 0,
          ]),
        ),
        percentOfSessionsByType: Object.fromEntries(
          (Object.keys(typeCount) as (keyof typeof typeCount)[]).map((t) => [
            t,
            sessionsSnap.docs.length
              ? Math.round((typeCount[t] / sessionsSnap.docs.length) * 1000) /
                10
              : 0,
          ]),
        ),
        rawCounts: typeCount,
      });

      // --- Streaks (users.statistics.dayWithoutBreak = max streak ever) ---
      const usersCountSnap = await firestore.collection("users").count().get();
      const totalUsers = usersCountSnap.data().count;

      const topStreaksSnap = await firestore
        .collection("users")
        .orderBy("statistics.dayWithoutBreak", "desc")
        .limit(10)
        .get();
      const topStreaks = topStreaksSnap.docs
        .map((doc) => doc.get("statistics.dayWithoutBreak") as number)
        .filter((n) => typeof n === "number");

      const thresholds = [7, 14, 30, 60, 90];
      const thresholdCounts: Record<number, number> = {};
      for (const t of thresholds) {
        const snap = await firestore
          .collection("users")
          .where("statistics.dayWithoutBreak", ">=", t)
          .count()
          .get();
        thresholdCounts[t] = snap.data().count;
      }

      console.log("[blog-stats] streaks:", {
        totalUsers,
        topStreaks,
        longestStreak: topStreaks[0] ?? 0,
        thresholdCounts,
        thresholdPercents: Object.fromEntries(
          thresholds.map((t) => [
            t,
            totalUsers
              ? Math.round((thresholdCounts[t] / totalUsers) * 1000) / 10
              : 0,
          ]),
        ),
      });

      // --- Does a streak actually correlate with more practice? Splits all
      // users into "ever built a streak of N+ days" vs. everyone else, and
      // compares lifetime sessionCount/points/lvl between the two groups.
      // This is the one number that directly backs the article's core claim
      // ("tracking/accountability is what drives consistency, which drives
      // skill development") with real product data, instead of just citing
      // outside research for it. ---
      const usersStatsSnap = await firestore
        .collection("users")
        .select(
          "statistics.dayWithoutBreak",
          "statistics.sessionCount",
          "statistics.points",
          "statistics.lvl",
        )
        .get();

      const users = usersStatsSnap.docs.map((doc) => ({
        streak: (doc.get("statistics.dayWithoutBreak") as number) ?? 0,
        sessionCount: (doc.get("statistics.sessionCount") as number) ?? 0,
        points: (doc.get("statistics.points") as number) ?? 0,
        lvl: (doc.get("statistics.lvl") as number) ?? 0,
      }));

      const avg = (values: number[]) =>
        values.length
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;

      const zeroSessionUsers = users.filter((u) => u.sessionCount === 0);
      console.log("[blog-stats] all-users session count distribution:", {
        totalUsers: users.length,
        medianSessionCount: median(users.map((u) => u.sessionCount)),
        avgSessionCount:
          Math.round(avg(users.map((u) => u.sessionCount)) * 10) / 10,
        zeroSessionUsers: zeroSessionUsers.length,
        zeroSessionPercent:
          Math.round((zeroSessionUsers.length / users.length) * 1000) / 10,
      });

      for (const streakThreshold of [7, 14, 30]) {
        const withStreak = users.filter((u) => u.streak >= streakThreshold);
        const withoutStreak = users.filter((u) => u.streak < streakThreshold);

        console.log(
          `[blog-stats] streak-vs-volume (>=${streakThreshold}-day streak):`,
          {
            withStreakCount: withStreak.length,
            withoutStreakCount: withoutStreak.length,
            avgSessionCount: {
              withStreak:
                Math.round(avg(withStreak.map((u) => u.sessionCount)) * 10) /
                10,
              withoutStreak:
                Math.round(
                  avg(withoutStreak.map((u) => u.sessionCount)) * 10,
                ) / 10,
            },
            medianSessionCount: {
              withStreak: median(withStreak.map((u) => u.sessionCount)),
              withoutStreak: median(withoutStreak.map((u) => u.sessionCount)),
            },
            avgPoints: {
              withStreak:
                Math.round(avg(withStreak.map((u) => u.points)) * 10) / 10,
              withoutStreak:
                Math.round(avg(withoutStreak.map((u) => u.points)) * 10) / 10,
            },
            avgLvl: {
              withStreak:
                Math.round(avg(withStreak.map((u) => u.lvl)) * 10) / 10,
              withoutStreak:
                Math.round(avg(withoutStreak.map((u) => u.lvl)) * 10) / 10,
            },
          },
        );
      }
    },
    120 * 1000,
  );
});
