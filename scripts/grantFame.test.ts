// @vitest-environment node

/**
 * One-off admin grant: credits a single account with Fame.
 *
 * Written as `FieldValue.increment` rather than an absolute write, so a session
 * that reports while this runs is not clobbered — the same reason every in-app
 * Fame reward increments instead of writing `balance + reward`.
 *
 * Run with:
 *   GRANT_FAME_UID=<uid> GRANT_FAME_AMOUNT=10000 npm run grant-fame
 *
 * Guarded by `--mode grantfame` so a plain `vitest`/`npm run test` skips it.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, it } from "vitest";

// Vitest only auto-loads .env files matching its mode, so fall back to the
// project env files Next.js uses in dev.
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

const isGrantMode = (import.meta as any).env?.MODE === "grantfame";

(isGrantMode ? describe : describe.skip)("Grant fame", () => {
  it(
    "credits one account with the requested Fame",
    async () => {
      const uid = process.env.GRANT_FAME_UID;
      if (!uid) {
        throw new Error(
          "GRANT_FAME_UID not set — refusing to guess which account to write to",
        );
      }
      const amount = Number(process.env.GRANT_FAME_AMOUNT);
      if (!Number.isInteger(amount) || amount === 0) {
        throw new Error(
          `GRANT_FAME_AMOUNT must be a non-zero whole number, got "${process.env.GRANT_FAME_AMOUNT}"`,
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
      const userRef = firestore.collection("users").doc(uid);
      const snapshot = await userRef.get();
      if (!snapshot.exists) throw new Error(`No user document for uid ${uid}`);

      const before = snapshot.data()?.statistics?.fame ?? 0;
      await userRef.update({
        "statistics.fame": admin.firestore.FieldValue.increment(amount),
      });
      const after = (await userRef.get()).data()?.statistics?.fame ?? 0;

      console.log(
        `[grant-fame] ${uid}: ${before} -> ${after} (${amount > 0 ? "+" : ""}${amount})`,
      );
    },
    60 * 1000,
  );
});
