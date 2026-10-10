// @vitest-environment node

/**
 * One-off admin grant: adds one copy of every Guitar Builder part to a single
 * account's `arsenal.components`, each with a freshly rolled level, so the
 * Builder tab can be exercised end to end without opening cases first.
 *
 * Additive: existing parts are kept; the grant only appends.
 *
 * Run with:
 *   GRANT_COMPONENTS_UID=<uid> npm run grant-components
 *
 * Guarded by `--mode grantcomponents` so a plain `vitest`/`npm run test` skips it.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, it } from "vitest";

import { COMPONENT_DEFS } from "../src/feature/guitarBuilder/data/components";
import type { OwnedComponent } from "../src/feature/guitarBuilder/types/guitarBuilder.types";
import { rollLevel } from "../src/feature/guitarBuilder/utils/components";

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

const isGrantMode = (import.meta as any).env?.MODE === "grantcomponents";

(isGrantMode ? describe : describe.skip)("Grant Guitar Builder parts", () => {
  it("appends one of every part to one account", async () => {
    const uid = process.env.GRANT_COMPONENTS_UID;
    if (!uid) {
      throw new Error(
        "GRANT_COMPONENTS_UID not set — refusing to guess which account to write to",
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

    const existing: OwnedComponent[] =
      snapshot.data()?.arsenal?.components ?? [];
    const now = Date.now();
    const granted: OwnedComponent[] = COMPONENT_DEFS.map((def, i) => ({
      uid: `${def.id}#grant${now.toString(36)}${i}`,
      defId: def.id,
      level: rollLevel(def, Math.random),
      acquiredAt: now,
      isNew: true,
    }));

    await userRef.update({ "arsenal.components": [...existing, ...granted] });

    console.log(
      `[grant-components] ${uid}: +${granted.length} parts (had ${existing.length}), fame ${snapshot.data()?.statistics?.fame ?? 0}`,
    );
  }, 60 * 1000);
});
