// @vitest-environment node

/**
 * One-off admin grant: puts Trait Extractors into one account's stash.
 *
 * Appended with `FieldValue.arrayUnion`, so an extractor the player gets from a
 * Parts Crate while this runs is not overwritten. Every granted extractor has an
 * id of its own (`grant:<time>-<n>`), so none collides with a dropped one.
 *
 * Run with:
 *   GRANT_EXTRACTORS_UID=<uid> GRANT_EXTRACTORS_COUNT=5 npx vitest run --mode grantextractors scripts/grantTraitExtractors.test.ts
 *
 * Guarded by `--mode grantextractors` so a plain `vitest`/`npm run test` skips it.
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

const isGrantMode = (import.meta as any).env?.MODE === "grantextractors";

(isGrantMode ? describe : describe.skip)("Grant trait extractors", () => {
  it(
    "puts the requested number of extractors into one account's stash",
    async () => {
      const uid = process.env.GRANT_EXTRACTORS_UID;
      if (!uid) {
        throw new Error(
          "GRANT_EXTRACTORS_UID not set — refusing to guess which account to write to",
        );
      }
      const count = Number(process.env.GRANT_EXTRACTORS_COUNT);
      if (!Number.isInteger(count) || count <= 0 || count > 50) {
        throw new Error(
          `GRANT_EXTRACTORS_COUNT must be a whole number from 1 to 50, got "${process.env.GRANT_EXTRACTORS_COUNT}"`,
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

      const before: unknown[] = snapshot.data()?.arsenal?.traitExtractors ?? [];
      const now = Date.now();
      const granted = Array.from({ length: count }, (_, i) => ({
        id: `grant:${now.toString(36)}-${i}`,
        acquiredAt: now,
      }));

      await userRef.update({
        "arsenal.traitExtractors": admin.firestore.FieldValue.arrayUnion(
          ...granted,
        ),
      });
      const after: unknown[] =
        (await userRef.get()).data()?.arsenal?.traitExtractors ?? [];

      console.log(
        `[grant-extractors] ${uid}: ${before.length} -> ${after.length} (+${count})`,
      );
    },
    60 * 1000,
  );
});
