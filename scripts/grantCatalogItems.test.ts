// @vitest-environment node

/**
 * One-off admin grant: puts named catalogue guitars and pedals into a single
 * account, so new gear can be looked at on a real rig before it drops.
 *
 * The instances are rolled exactly as `open-case` rolls them — year, country,
 * condition, features, traits and the global serial counter — so a granted
 * item is indistinguishable from an earned one. Both go into the Dex too.
 *
 * Additive: the existing inventory is kept; the grant only appends.
 *
 * Run with:
 *   GRANT_UID=<uid> GRANT_GUITARS=90-98 GRANT_EFFECTS=55-60 npm run grant-items
 *
 * Ids are a comma list, ranges allowed ("90-92,95"). Guarded by
 * `--mode grantitems` so a plain `vitest`/`npm run test` skips it.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, it } from "vitest";

import { EFFECTS_BY_ID } from "../src/feature/arsenal/data/effectDefinitions";
import {
  rollEffectCountry,
  rollEffectFeatures,
  rollEffectYear,
} from "../src/feature/arsenal/data/effectStats";
import { GUITARS_BY_ID } from "../src/feature/arsenal/data/guitarDefinitions";
import {
  rollCondition,
  rollItemFeatures,
  rollVintageYear,
} from "../src/feature/arsenal/data/itemStats";
import { rollItemTraits } from "../src/feature/arsenal/data/traits";
import type {
  EffectDefinition,
  EffectInventoryItem,
  GuitarDefinition,
  InventoryItem,
} from "../src/feature/arsenal/types/arsenal.types";

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

/** "90-92,95" → [90, 91, 92, 95]. */
const parseIds = (raw: string | undefined): number[] =>
  (raw ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const [from, to] = part.split("-").map(Number);
      if (to === undefined) return [from];
      return Array.from({ length: to - from + 1 }, (_, i) => from + i);
    });

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const isGrantMode = (import.meta as any).env?.MODE === "grantitems";

(isGrantMode ? describe : describe.skip)("Grant catalogue items", () => {
  it(
    "appends the named guitars and pedals to one account",
    async () => {
      const uid = process.env.GRANT_UID;
      if (!uid) {
        throw new Error(
          "GRANT_UID not set — refusing to guess which account to write to",
        );
      }

      const guitars = parseIds(process.env.GRANT_GUITARS).map((id) => {
        const def = GUITARS_BY_ID.get(id);
        if (!def) throw new Error(`Unknown guitar id ${id}`);
        return def;
      });
      const effects = parseIds(process.env.GRANT_EFFECTS).map((id) => {
        const def = EFFECTS_BY_ID.get(id);
        if (!def) throw new Error(`Unknown effect id ${id}`);
        return def;
      });
      if (guitars.length + effects.length === 0) {
        throw new Error(
          "Nothing to grant — set GRANT_GUITARS and/or GRANT_EFFECTS",
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
      const serialRef = (
        kind: string,
        def: GuitarDefinition | EffectDefinition,
      ) => firestore.collection("arsenalSerials").doc(`${kind}-${def.id}`);

      const summary = await firestore.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error(`No user document for uid ${uid}`);

        // Every read before the first write, serial counters included.
        const guitarSerials = await Promise.all(
          guitars.map((def) => t.get(serialRef("guitar", def))),
        );
        const effectSerials = await Promise.all(
          effects.map((def) => t.get(serialRef("effect", def))),
        );

        const now = Date.now();
        const grantedGuitars: InventoryItem[] = guitars.map((def, i) => {
          const rolled = rollItemFeatures(def);
          const traits = rollItemTraits(def.rarity, "guitar");
          return {
            id: generateId(),
            guitarId: def.id,
            acquiredAt: now,
            isNew: true,
            year: rollVintageYear(def.yearFrom, def.yearTo),
            country:
              def.countries[Math.floor(Math.random() * def.countries.length)],
            condition: rollCondition(),
            serial: (guitarSerials[i].data()?.count || 0) + 1,
            ...(rolled
              ? { stats: rolled.stats, features: rolled.features }
              : {}),
            ...(traits ? { traits } : {}),
          };
        });
        const grantedEffects: EffectInventoryItem[] = effects.map((def, i) => {
          const rolled = rollEffectFeatures(def.rarity, def.type);
          const traits = rollItemTraits(def.rarity, "effect", def.type);
          return {
            id: generateId(),
            effectId: def.id,
            acquiredAt: now,
            isNew: true,
            year: rollEffectYear(def),
            country: rollEffectCountry(def),
            condition: rollCondition(),
            serial: (effectSerials[i].data()?.count || 0) + 1,
            ...(rolled
              ? { stats: rolled.stats, features: rolled.features }
              : {}),
            ...(traits ? { traits } : {}),
          };
        });

        const arsenal = userDoc.data()?.arsenal ?? {};
        const update: Record<string, unknown> = {};
        if (grantedGuitars.length) {
          update["arsenal.inventory"] = [
            ...(arsenal.inventory ?? []),
            ...grantedGuitars,
          ];
          update["arsenal.dexGuitars"] = admin.firestore.FieldValue.arrayUnion(
            ...guitars.map((def) => def.id),
          );
        }
        if (grantedEffects.length) {
          update["arsenal.effectInventory"] = [
            ...(arsenal.effectInventory ?? []),
            ...grantedEffects,
          ];
          update["arsenal.dexEffects"] = admin.firestore.FieldValue.arrayUnion(
            ...effects.map((def) => def.id),
          );
        }
        t.update(userRef, update);
        guitars.forEach((def, i) =>
          t.set(
            serialRef("guitar", def),
            { count: grantedGuitars[i].serial },
            { merge: true },
          ),
        );
        effects.forEach((def, i) =>
          t.set(
            serialRef("effect", def),
            { count: grantedEffects[i].serial },
            { merge: true },
          ),
        );

        return [
          ...grantedGuitars.map(
            (item, i) => `${guitars[i].name} #${item.serial} (${item.year})`,
          ),
          ...grantedEffects.map(
            (item, i) => `${effects[i].name} #${item.serial} (${item.year})`,
          ),
        ];
      });

      console.log(
        `[grant-items] ${uid}: +${summary.length}\n${summary.join("\n")}`,
      );
    },
    60 * 1000,
  );
});
