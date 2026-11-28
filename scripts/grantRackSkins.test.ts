// @vitest-environment node

/**
 * One-off admin grant: every display case in the shop (RACK_SKINS) to a single
 * account's `arsenal.boardSkins.owned`, free. What the account already owns and
 * what its board, cable and Rig bays wear stay as they are; the grant only adds.
 *
 * Run with:
 *   GRANT_RACKS_UID=<uid> npm run grant-racks
 *
 * Guarded by `--mode grantracks` so a plain `vitest`/`npm run test` skips it.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  RACK_SKINS,
  readBoardSkins,
} from "../src/feature/arsenal/data/boardSkins";

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

const isGrantMode = (import.meta as any).env?.MODE === "grantracks";

(isGrantMode ? describe : describe.skip)("Grant every display case", () => {
  it(
    "adds every case in the shop to one account",
    async () => {
      const uid = process.env.GRANT_RACKS_UID;
      if (!uid) {
        throw new Error(
          "GRANT_RACKS_UID not set — refusing to guess which account to write to",
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

      const before = readBoardSkins(snapshot.data()?.arsenal?.boardSkins);
      const owned = [
        ...new Set([...before.owned, ...RACK_SKINS.map((skin) => skin.id)]),
      ];
      // update() on the dotted path, the shop's own write: the rest of `arsenal` is untouched.
      await userRef.update({ "arsenal.boardSkins": { ...before, owned } });

      // Read back what was stored, not what was meant to be.
      const after = readBoardSkins(
        (await userRef.get()).data()?.arsenal?.boardSkins,
      );
      const missing = RACK_SKINS.filter(
        (skin) => !after.owned.includes(skin.id),
      ).map((skin) => skin.id);
      expect(missing).toEqual([]);
      expect(after.rack).toEqual(before.rack);

      console.log(
        `[grant-racks] ${uid}: ${RACK_SKINS.length} cases in the shop, owned ${before.owned.length} → ${after.owned.length} skins; bays still wear ${JSON.stringify(after.rack)}`,
      );
    },
    60 * 1000,
  );
});
