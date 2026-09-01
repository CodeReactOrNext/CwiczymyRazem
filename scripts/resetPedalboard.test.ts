// @vitest-environment node

/**
 * One-off admin reset: puts a single account's pedalboard back to the start.
 *
 * What it clears, and why each one is on the list:
 *
 *  • `pedalboardItems` — the pedals standing on the deck. The pedals themselves
 *    are *not* touched: they stay in `effectInventory`, so nothing is destroyed
 *    and the player can put the board back together.
 *  • `power` — the DC cables. An empty array rather than a delete, because
 *    absent means "a board from before the brick existed, treat it as fully
 *    powered" and that is not what a reset should mean.
 *  • `boardTier` / `supplyTier` — the hardware ladders, back to the bottom rung,
 *    when `RESET_PEDALBOARD_HARDWARE=1`. Off by default: those rungs were paid
 *    for in Fame and this script does not refund them.
 *
 * Run with:
 *   RESET_PEDALBOARD_UID=<uid> npm run reset-pedalboard
 *   RESET_PEDALBOARD_UID=<uid> RESET_PEDALBOARD_HARDWARE=1 npm run reset-pedalboard
 *
 * Guarded by `--mode reset-pedalboard` so a plain `vitest`/`npm test` skips it,
 * and it prints what it found before it writes, so the change is auditable after
 * the fact.
 *
 * On a machine whose OpenSSL CA bundle is broken, Firestore fails to connect at
 * all (`14 UNAVAILABLE … unable to verify the first certificate`). Prefix the
 * run with `NODE_OPTIONS=--use-system-ca` there.
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

/**
 * Straight to stdout, not through `console`.
 *
 * The runner is vitest, which captures `console` and prints it only for a
 * failing test — and this script succeeding is exactly when its output matters,
 * because the "before" line is the only record of a board that no longer
 * exists.
 */
const say = (...parts: unknown[]) =>
  process.stdout.write(`${parts.map(String).join(" ")}\n`);

const isResetMode = (import.meta as any).env?.MODE === "reset-pedalboard";

(isResetMode ? describe : describe.skip)("Reset pedalboard", () => {
  it(
    "clears one account's board back to an empty deck",
    async () => {
      const uid = process.env.RESET_PEDALBOARD_UID;
      if (!uid) {
        throw new Error(
          "RESET_PEDALBOARD_UID not set — refusing to guess which account to write to",
        );
      }
      const alsoHardware = process.env.RESET_PEDALBOARD_HARDWARE === "1";

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

      const rig = snapshot.data()?.arsenal?.rig ?? {};
      // Printed before the write, because this is the only record of what the
      // board was: there is nothing to undo a reset with.
      say(
        `[reset-pedalboard] ${uid} before:`,
        JSON.stringify({
          pedals: Array.isArray(rig.pedalboardItems)
            ? rig.pedalboardItems.length
            : rig.pedalboardItems,
          power: Array.isArray(rig.power) ? rig.power.length : rig.power,
          boardTier: rig.boardTier,
          supplyTier: rig.supplyTier,
        }),
      );
      say(
        `[reset-pedalboard] items: ${JSON.stringify(rig.pedalboardItems ?? null)}`,
      );
      say(`[reset-pedalboard] power: ${JSON.stringify(rig.power ?? null)}`);

      await userRef.update({
        "arsenal.rig.pedalboardItems": [],
        "arsenal.rig.power": [],
        ...(alsoHardware
          ? { "arsenal.rig.boardTier": 0, "arsenal.rig.supplyTier": 0 }
          : {}),
      });

      const after = (await userRef.get()).data()?.arsenal?.rig ?? {};
      say(
        `[reset-pedalboard] ${uid} after:`,
        JSON.stringify({
          pedals: after.pedalboardItems?.length,
          power: after.power?.length,
          boardTier: after.boardTier,
          supplyTier: after.supplyTier,
        }),
        alsoHardware ? "(hardware reset too)" : "(hardware left alone)",
      );
    },
    60 * 1000,
  );
});
