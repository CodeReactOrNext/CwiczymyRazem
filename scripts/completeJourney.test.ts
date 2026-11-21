// @vitest-environment node

/**
 * One-off admin action: marks every step of every journey module as completed
 * for a single account.
 *
 * Steps already completed keep their own date and stars; only the missing ones
 * are written (practice/exam steps with 3 stars). Rewards are not granted here —
 * the player still claims them in the app, which re-derives completion from the
 * same `journeyProgress` document.
 *
 * Run with (PowerShell):
 *   $env:COMPLETE_JOURNEY_UID="<uid>"; npx vitest run --mode completejourney scripts/completeJourney.test.ts
 *
 * Guarded by `--mode completejourney` so a plain `vitest`/`npm run test` skips it.
 */
import * as admin from "firebase-admin";
import { journeyModules } from "feature/journey/data/journeyModules";
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

const isMode = (import.meta as any).env?.MODE === "completejourney";

(isMode ? describe : describe.skip)("Complete journey", () => {
  it(
    "marks every journey step as completed for one account",
    async () => {
      const uid = process.env.COMPLETE_JOURNEY_UID;
      if (!uid) {
        throw new Error(
          "COMPLETE_JOURNEY_UID not set — refusing to guess which account to write to",
        );
      }

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
      const userSnap = await firestore.collection("users").doc(uid).get();
      if (!userSnap.exists) throw new Error(`No user document for uid ${uid}`);

      const ref = firestore.collection("journeyProgress").doc(uid);
      const existing = (await ref.get()).data();
      const now = new Date().toISOString();

      // One field path per step, written with update(). Never a nested map under
      // set({merge:true}): an empty map there is a leaf value and wipes the whole
      // branch (it erased this player's progress once).
      const args: unknown[] = [];
      for (const mod of journeyModules) {
        const savedSteps = existing?.moduleProgress?.[mod.id]?.steps ?? {};
        let before = 0;
        let total = 0;
        for (const stage of mod.stages) {
          for (const step of stage.steps) {
            total += 1;
            if (savedSteps[step.id]?.completed) {
              before += 1;
              continue;
            }
            args.push(
              new admin.firestore.FieldPath("moduleProgress", mod.id, "steps", step.id),
              step.modalOnly
                ? { completed: true, completedAt: now }
                : { completed: true, completedAt: now, stars: 3 },
            );
          }
        }
        console.log(
          `[complete-journey] ${uid} ${mod.id}: ${before}/${total} -> ${total}/${total}`,
        );
      }

      if (!existing) {
        await ref.set({ userId: uid, moduleProgress: {}, updatedAt: now });
      }
      if (args.length === 0) return;
      await (ref.update as (...a: unknown[]) => Promise<unknown>)(
        "updatedAt",
        now,
        ...args,
      );
    },
    60 * 1000,
  );
});
