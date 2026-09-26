// @vitest-environment node

/**
 * One-off repair: takes the owner's run back out of followers' roadmap progress.
 *
 * A player who pressed "Start this roadmap" on somebody else's legacy roadmap
 * — one whose document still carries the owner's `sessionsCompleted` and
 * checkpoint results — saw those numbers on their own map, and the first save
 * copied them into `userRoadmapProgress/{follower}_{roadmap}`. The map no
 * longer does that; this script cleans up what it left behind. The rules for
 * what counts as a copy are in `lib/roadmaps/followerProgressRepair`.
 *
 * Only follower documents are touched, and only `stepProgress` and
 * `phaseChecks` in them. The roadmap documents and the owners' progress stay
 * as they are.
 *
 * Dry run by default — it prints every document it would change. Write with:
 *   npm run repair-follower-roadmap-progress
 *   REPAIR_FOLLOWER_PROGRESS_WRITE=1 npm run repair-follower-roadmap-progress
 *
 * On a machine whose OpenSSL CA bundle is broken, prefix the run with
 * `NODE_OPTIONS=--use-system-ca`.
 */
import type { Roadmap } from "feature/aiCoach/types/roadmap.types";
import * as admin from "firebase-admin";
import fs from "fs";
import {
  type FollowerProgressDoc,
  repairFollowerProgress,
} from "lib/roadmaps/followerProgressRepair";
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

/** Straight to stdout: vitest swallows `console` for a passing test. */
const say = (...parts: unknown[]) =>
  process.stdout.write(`${parts.map(String).join(" ")}\n`);

const isRepairMode =
  (import.meta as { env?: { MODE?: string } }).env?.MODE ===
  "repair-follower-progress";

(isRepairMode ? describe : describe.skip)(
  "Repair follower roadmap progress",
  () => {
    it(
      "clears the owner's counters out of followers' progress documents",
      async () => {
        const write = process.env.REPAIR_FOLLOWER_PROGRESS_WRITE === "1";

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

        const [roadmapSnap, progressSnap] = await Promise.all([
          firestore.collection("roadmaps").get(),
          firestore.collection("userRoadmapProgress").get(),
        ]);
        const roadmaps = new Map(
          roadmapSnap.docs.map((doc) => [doc.id, doc.data() as Roadmap]),
        );

        let scanned = 0;
        let repaired = 0;
        let batch = firestore.batch();
        let pending = 0;

        for (const doc of progressSnap.docs) {
          const progress = doc.data() as FollowerProgressDoc;
          const roadmap = roadmaps.get(progress.roadmapId);
          // Curated roadmaps live in the repo, not in `roadmaps`: nothing of
          // an owner's is embedded in them.
          if (!roadmap) continue;
          scanned++;

          const repair = repairFollowerProgress(roadmap, progress);
          if (!repair) continue;
          repaired++;

          // Printed before the write: the only record of what was there.
          say(
            `[repair] ${doc.id}`,
            `steps: ${repair.clearedSteps.join(",") || "-"}`,
            `checkpoints: ${repair.clearedPhases.join(",") || "-"}`,
            `before: ${JSON.stringify({
              stepProgress: progress.stepProgress ?? {},
              phaseChecks: progress.phaseChecks ?? {},
            })}`,
          );

          if (!write) continue;
          batch.update(doc.ref, {
            stepProgress: repair.stepProgress,
            phaseChecks: repair.phaseChecks,
          });
          if (++pending === 400) {
            await batch.commit();
            batch = firestore.batch();
            pending = 0;
          }
        }
        if (write && pending) await batch.commit();

        say(
          `[repair] ${scanned} follower/owner documents on generated roadmaps,`,
          `${repaired} carried the owner's run —`,
          write ? "repaired." : "dry run, nothing written.",
        );
      },
      5 * 60 * 1000,
    );
  },
);
