// @vitest-environment node

/**
 * Recounts how many accounts hold each achievement, into `config/achievementStats`.
 *
 * The report route keeps that document live by incrementing it as badges are
 * earned, so this is not a one-off bootstrap — it is the repair pass. Increments
 * drift from the truth over time: a failed write, a badge granted by hand in the
 * console, a deleted account. Run this whenever the numbers need to be true
 * again; it overwrites rather than adjusts.
 *
 * Run with:
 *   npm run backfill-achievement-stats
 *   ACHIEVEMENT_STATS_DRY_RUN=1 npm run backfill-achievement-stats   (print only)
 *
 * Guarded by `--mode achievement-stats` so a plain `npm test` skips it.
 */
import { achievementsData } from "feature/achievements/data/achievementsData";
import type { AchievementList } from "feature/achievements/types";
import * as admin from "firebase-admin";
import fs from "fs";
import {
  ACHIEVEMENT_STATS_PATH,
  rateFromStats,
  tallyAchievementStats,
} from "lib/achievements/achievementStats";
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

/** Paged, so the scan holds one page rather than every account at once. */
const PAGE_SIZE = 500;

const isBackfillMode = (import.meta as any).env?.MODE === "achievement-stats";

(isBackfillMode ? describe : describe.skip)("Backfill achievement stats", () => {
  it(
    "recounts every account into the stats document",
    async () => {
      const serviceAccountJson = readServiceAccountJson();
      if (!serviceAccountJson) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_JSON not found in process.env or project .env files"
        );
      }
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
        });
      }

      const firestore = admin.firestore();
      const accounts: { achievements?: AchievementList[]; sessionCount?: number }[] = [];

      // `select()` so each page carries the two fields this needs rather than
      // whole user documents — an arsenal alone can be hundreds of items.
      let cursor: admin.firestore.QueryDocumentSnapshot | undefined;
      let scanned = 0;

      for (;;) {
        let query = firestore
          .collection("users")
          .orderBy(admin.firestore.FieldPath.documentId())
          .select("statistics.achievements", "statistics.sessionCount")
          .limit(PAGE_SIZE);
        if (cursor) query = query.startAfter(cursor);

        const page = await query.get();
        if (page.empty) break;

        for (const doc of page.docs) {
          const statistics = doc.data()?.statistics ?? {};
          accounts.push({
            achievements: statistics.achievements,
            sessionCount: statistics.sessionCount,
          });
        }

        scanned += page.docs.length;
        cursor = page.docs[page.docs.length - 1];
        if (page.docs.length < PAGE_SIZE) break;
      }

      const stats = tallyAchievementStats(accounts);

      console.log(
        `[achievement-stats] scanned ${scanned} accounts, ${stats.totalPlayers} of them have practised`
      );

      const rows = achievementsData
        .map((def) => ({
          id: def.id,
          rarity: def.rarity,
          held: stats.counts[def.id] ?? 0,
          rate: rateFromStats(def.id, stats) ?? 0,
        }))
        .sort((a, b) => b.rate - a.rate);

      for (const row of rows) {
        console.log(
          `  ${String(row.rate).padStart(5)}%  ${String(row.held).padStart(5)}  ${row.id} (${row.rarity})`
        );
      }

      const unheld = rows.filter((r) => r.held === 0);
      if (unheld.length > 0) {
        console.log(
          `[achievement-stats] nobody holds ${unheld.length}: ${unheld.map((r) => r.id).join(", ")}`
        );
      }

      if (process.env.ACHIEVEMENT_STATS_DRY_RUN) {
        console.log("[achievement-stats] dry run — nothing written");
        return;
      }

      const [collection, docId] = ACHIEVEMENT_STATS_PATH.split("/");
      await firestore.collection(collection).doc(docId).set(stats);
      console.log(`[achievement-stats] wrote ${ACHIEVEMENT_STATS_PATH}`);
    },
    10 * 60 * 1000
  );
});
