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
        .select("timeSumary.sumTime")
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
    },
    120 * 1000,
  );
});
