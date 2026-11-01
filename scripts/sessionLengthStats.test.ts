// @vitest-environment node

/**
 * Rerunnable, read-only script: prints the session-length distribution shown by
 * src/components/Blog/SessionLengthStat.tsx (used in the "how long to practise"
 * and beginner-checklist blog posts). Paste the printed numbers into that card.
 *
 * Reads every practice-report doc in `logs` (the ones carrying
 * `timeSumary.sumTime`, same filter as updateHeroStats) with only the duration,
 * uid and timestamp fields selected: about one read per session.
 *
 * "Practice day" = all minutes one uid logged on one UTC calendar day.
 *
 * Run with: npm run session-length-stats
 * Guarded by `--mode session-stats` so a plain `vitest`/`npm run test` skips it.
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

/** Nearest-rank percentile of an ascending array. */
const percentile = (sorted: number[], p: number) =>
  sorted[Math.floor(p * (sorted.length - 1))];

const toDate = (value: unknown): Date =>
  value instanceof admin.firestore.Timestamp
    ? value.toDate()
    : new Date(value as string | number);

const isSessionStatsMode =
  (import.meta as { env?: { MODE?: string } }).env?.MODE === "session-stats";

(isSessionStatsMode ? describe : describe.skip)("Session length stats", () => {
  it(
    "prints the session and practice-day distribution",
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

      const snap = await admin
        .firestore()
        .collection("logs")
        .where("timeSumary.sumTime", ">=", 0)
        .select("timeSumary.sumTime", "uid", "timestamp")
        .get();

      const sessions = snap.docs
        .map((doc) => ({
          minutes: (doc.get("timeSumary.sumTime") ?? 0) / 60_000,
          uid: doc.get("uid") as string,
          day: toDate(doc.get("timestamp")),
        }))
        .filter((session) => session.minutes > 0);

      const sessionMinutes = sessions
        .map((session) => session.minutes)
        .sort((a, b) => a - b);

      const perDay = new Map<string, number>();
      for (const session of sessions) {
        if (Number.isNaN(session.day.getTime())) continue;
        const key = `${session.uid}|${session.day.toISOString().slice(0, 10)}`;
        perDay.set(key, (perDay.get(key) ?? 0) + session.minutes);
      }
      const dayMinutes = [...perDay.values()].sort((a, b) => a - b);

      // Practice days per Monday-start week, counting only weeks with any practice.
      const weekStart = (isoDay: string) => {
        const date = new Date(`${isoDay}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
        return date.toISOString().slice(0, 10);
      };
      const weeksByPlayer = new Map<string, Map<string, number>>();
      for (const key of perDay.keys()) {
        const [uid, isoDay] = key.split("|");
        const weeks = weeksByPlayer.get(uid) ?? new Map<string, number>();
        const week = weekStart(isoDay);
        weeks.set(week, (weeks.get(week) ?? 0) + 1);
        weeksByPlayer.set(uid, weeks);
      }
      const weekDayCounts = [...weeksByPlayer.values()].flatMap((weeks) => [
        ...weeks.values(),
      ]);
      const regularPlayers = [...weeksByPlayer.values()].filter(
        (weeks) => weeks.size >= 3,
      );
      const typicalDaysPerWeek = regularPlayers
        .map((weeks) => {
          const counts = [...weeks.values()].sort((a, b) => a - b);
          return counts[Math.floor((counts.length - 1) / 2)];
        })
        .sort((a, b) => a - b);
      const share = (days: number) =>
        Math.round(
          (100 * weekDayCounts.filter((count) => count === days).length) /
            weekDayCounts.length,
        );

      const mean =
        sessionMinutes.reduce((sum, value) => sum + value, 0) /
        sessionMinutes.length;

      console.log("[session-length-stats]", {
        measuredOn: new Date().toISOString().slice(0, 10),
        players: new Set(sessions.map((session) => session.uid)).size,
        sessions: sessionMinutes.length,
        sessionMedian: Math.round(percentile(sessionMinutes, 0.5)),
        sessionMean: Math.round(mean),
        practiceDays: dayMinutes.length,
        dayP25: Math.round(percentile(dayMinutes, 0.25)),
        dayMedian: Math.round(percentile(dayMinutes, 0.5)),
        dayP75: Math.round(percentile(dayMinutes, 0.75)),
        activeWeeks: weekDayCounts.length,
        weeksWithOneDayPct: share(1),
        weeksWithSevenDaysPct: share(7),
        playersWithOneDay: [...weeksByPlayer.values()].filter(
          (weeks) =>
            weeks.size === 1 && [...weeks.values()][0] === 1,
        ).length,
        regularPlayers: regularPlayers.length,
        regularTypicalDaysPerWeek: typicalDaysPerWeek[
          Math.floor((typicalDaysPerWeek.length - 1) / 2)
        ],
        sessionsOverFourHours: sessionMinutes.filter((value) => value > 240)
          .length,
      });
    },
    120 * 1000,
  );
});
