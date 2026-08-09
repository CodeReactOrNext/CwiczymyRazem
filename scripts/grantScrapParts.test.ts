// @vitest-environment node

/**
 * One-off admin grant: tops a single account's scrap wallet up to N of every
 * part/tier the game can actually produce, so the workshop can be exercised
 * end to end without grinding teardowns first.
 *
 * Non-destructive: each stack is raised to the target, never lowered, so an
 * account that already holds more keeps what it has.
 *
 * Only *valid* pairs are granted — a pot caps at Epic and a screw at Standard,
 * and Unique only exists for parts that visibly show. Handing out a "Legendary
 * screw" would seed data no teardown could ever produce.
 *
 * Run with:
 *   GRANT_PARTS_UID=<uid> npm run grant-scrap-parts
 *   GRANT_PARTS_UID=<uid> GRANT_PARTS_QTY=50 npm run grant-scrap-parts
 *
 * Guarded by `--mode grantparts` so a plain `vitest`/`npm run test` skips it.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, it } from "vitest";

import {
  PART_DEFINITIONS,
  PART_TIERS,
} from "../src/feature/arsenal/data/partDefinitions";
import type {
  PartTier,
  ScrapPart,
} from "../src/feature/arsenal/types/arsenal.types";

const DEFAULT_QTY = 50;

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

/** Every tier a given part can legitimately roll at. */
const tiersFor = (maxTier: PartTier, unique: boolean): PartTier[] => {
  const upTo = PART_TIERS.slice(0, PART_TIERS.indexOf(maxTier) + 1);
  return unique ? [...upTo, "Unique"] : upTo;
};

const isGrantMode = (import.meta as any).env?.MODE === "grantparts";

(isGrantMode ? describe : describe.skip)("Grant scrap parts", () => {
  it("tops one account up to N of every valid part and tier", async () => {
    const uid = process.env.GRANT_PARTS_UID;
    if (!uid) {
      throw new Error(
        "GRANT_PARTS_UID not set — refusing to guess which account to write to",
      );
    }
    const qty = Number(process.env.GRANT_PARTS_QTY ?? DEFAULT_QTY);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`GRANT_PARTS_QTY must be a positive number, got "${qty}"`);
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

    const existing: ScrapPart[] = snapshot.data()?.arsenal?.parts ?? [];
    const held = new Map<string, number>(
      existing.map((p) => [`${p.partId}:${p.tier}`, p.qty]),
    );

    const wallet: ScrapPart[] = [];
    let raised = 0;
    for (const def of PART_DEFINITIONS) {
      for (const tier of tiersFor(def.maxTier, def.unique ?? false)) {
        const have = held.get(`${def.id}:${tier}`) ?? 0;
        if (have < qty) raised++;
        wallet.push({ partId: def.id, tier, qty: Math.max(have, qty) });
        held.delete(`${def.id}:${tier}`);
      }
    }

    // Anything left in the map is a stack the current part list no longer knows
    // about; carry it over untouched rather than silently deleting it.
    for (const [key, remaining] of held) {
      const [partId, tier] = key.split(":");
      wallet.push({
        partId: partId as ScrapPart["partId"],
        tier: tier as PartTier,
        qty: remaining,
      });
    }

    await userRef.update({ "arsenal.parts": wallet });

    console.log(
      `[grant-scrap-parts] ${uid}: ${wallet.length} stacks written, ${raised} raised to ${qty}`,
    );
  }, 60 * 1000);
});
