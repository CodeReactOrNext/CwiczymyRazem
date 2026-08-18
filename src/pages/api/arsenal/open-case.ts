import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import type { DailyPoolEntry } from "feature/arsenal/data/dailyCase";
import { getDailyPool } from "feature/arsenal/data/dailyCase";
import { EFFECTS_BY_RARITY } from "feature/arsenal/data/effectDefinitions";
import { rollEffectCountry, rollEffectFeatures, rollEffectYear } from "feature/arsenal/data/effectStats";
import { GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { rollCondition, rollItemFeatures, rollVintageYear } from "feature/arsenal/data/itemStats";
import { rollItemTraits } from "feature/arsenal/data/traits";
import type {
  CaseType,
  EffectDefinition,
  EffectInventoryItem,
  GuitarDefinition,
  GuitarRarity,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import { buildDiscoveredSet } from "feature/arsenal/utils/dex";
import type { DocumentReference,Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

// 60% guitar, 40% effect
const GUITAR_CHANCE = 0.6;

// Flip to false to silence the public activity feed (e.g. while testing).
const LOG_CASE_OPENS = true;

// Partial: `Custom Shop` has no drop chance to state — it is workshop-only.
function drawRarity(probabilities: Partial<Record<GuitarRarity, number>>): GuitarRarity {
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, prob] of Object.entries(probabilities) as [GuitarRarity, number][]) {
    cumulative += prob ?? 0;
    if (roll < cumulative) return rarity;
  }
  return "Common";
}

/**
 * How often a pull prefers a model the player does not own yet, given the rarity
 * already rolled.
 *
 * Rarity is drawn first and is never touched by this — the odds printed on the
 * case card stay exactly true. All this decides is *which* item of that rarity
 * comes out, and only while the player is still missing some.
 *
 * Without it the collection ran into the coupon-collector wall: past about fifty
 * cases roughly two pulls in three were a model already in the Dex, and the
 * player was paying full price for a sell-for-scrap duplicate. Not 100%, because
 * duplicates are load-bearing elsewhere — they are the scrap and build economy's
 * raw material, and a stream that never repeats starves the workshop.
 */
const NEW_ITEM_BIAS = 0.7;

/**
 * One item of `rarity`, biased toward models the player is missing.
 *
 * Falls back to the full pool whenever the bias does not fire or the player
 * already owns everything at that rarity, so this can never fail to return.
 */
function pickBiased<T>(
  pool: readonly T[],
  isOwned: (item: T) => boolean,
): T {
  if (Math.random() < NEW_ITEM_BIAS) {
    const missing = pool.filter((item) => !isOwned(item));
    if (missing.length > 0) {
      return missing[Math.floor(Math.random() * missing.length)];
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, caseType } = req.body as { idToken: string; caseType: CaseType };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  const caseDef = CASE_DEFINITIONS[caseType];
  if (!caseDef) return res.status(400).json({ error: "Invalid case type" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore.collection("users").doc(userId) as DocumentReference;
    let capturedUserData: any = null;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      capturedUserData = data;
      const currentFame: number = data.statistics?.fame || 0;

      if (currentFame < caseDef.fameCost) throw new Error("INSUFFICIENT_FAME");

      const existingEquipped = data.arsenal?.equippedGuitarId ?? data.selectedGuitar ?? null;
      const newFame = currentFame - caseDef.fameCost;

      // What the Dex already has, for the new-item bias below. Built once here
      // rather than per draw site, and read from the stored document — the
      // request body has no say in what the player is deemed to own.
      //
      // The Dex record, not the stash: a model the player pulled and later sold
      // stays discovered, so the bias keeps steering pulls toward the models
      // that have genuinely never come out of a case.
      const discoveredGuitarIds = buildDiscoveredSet(
        data.arsenal?.dexGuitars,
        data.arsenal?.inventory as InventoryItem[] | undefined,
        (i) => i.guitarId,
      );
      const discoveredEffectIds = buildDiscoveredSet(
        data.arsenal?.dexEffects,
        data.arsenal?.effectInventory as EffectInventoryItem[] | undefined,
        (i) => i.effectId,
      );

      // Daily case: the drop comes from today's deterministic featured pool —
      // the exact 10 items the shop preview shows. Rarity is still rolled from
      // the case's probability table; the item is then picked from the pool's
      // entries of that rarity (guitar or effect, whatever the slot holds).
      let dailyPick: DailyPoolEntry | null = null;
      if (caseType === "daily") {
        const pool = getDailyPool();
        const rarity = drawRarity(caseDef.probabilities);
        const candidates = pool.filter((e) => e.def.rarity === rarity);
        // Slots guarantee every rarity is present; fall back to the whole pool just in case.
        const pickFrom = candidates.length > 0 ? candidates : pool;
        dailyPick = pickBiased(pickFrom, (entry) =>
          entry.kind === "guitar"
            ? discoveredGuitarIds.has(entry.def.id)
            : discoveredEffectIds.has(entry.def.id),
        );
      }

      const isGuitarDrop = dailyPick
        ? dailyPick.kind === "guitar"
        : caseDef.dropKind
          ? caseDef.dropKind === "guitar"
          : Math.random() < GUITAR_CHANCE;

      if (isGuitarDrop) {
        // Draw guitar
        let guitar: GuitarDefinition;
        if (dailyPick?.kind === "guitar") {
          guitar = dailyPick.def;
        } else {
          const rarity = drawRarity(caseDef.probabilities);
          const pool = GUITARS_BY_RARITY[rarity] || GUITARS_BY_RARITY["Common"];
          guitar = pickBiased(pool, (g) => discoveredGuitarIds.has(g.id));
        }
        const year = rollVintageYear(guitar.yearFrom, guitar.yearTo);
        const country = guitar.countries[Math.floor(Math.random() * guitar.countries.length)];
        const condition = rollCondition();
        const rolled = rollItemFeatures(guitar.rarity);
        const rolledTraits = rollItemTraits(guitar.rarity, "guitar");

        // Dex-new: first copy of this model ever pulled, as opposed to a duplicate.
        const isNewToDex = !discoveredGuitarIds.has(guitar.id);

        // Mint a global, sequential serial number for this guitar model.
        // Read happens before any write, so it's transaction-safe.
        const serialRef = firestore
          .collection("arsenalSerials")
          .doc(`guitar-${guitar.id}`) as DocumentReference;
        const serialDoc = await t.get(serialRef);
        const serial = (serialDoc.data()?.count || 0) + 1;

        const newItem: InventoryItem = {
          id: generateId(),
          guitarId: guitar.id,
          acquiredAt: Date.now(),
          isNew: true,
          year,
          country,
          condition,
          serial,
          ...(rolled ? { stats: rolled.stats, features: rolled.features } : {}),
          ...(rolledTraits ? { traits: rolledTraits } : {}),
        };

        const newInventory = [...(data.arsenal?.inventory || []), newItem];

        t.update(userRef, {
          "statistics.fame": newFame,
          "arsenal.inventory": newInventory,
          "arsenal.equippedGuitarId": existingEquipped,
          // Discovery is permanent — recorded on the pull, never removed on a sale.
          "arsenal.dexGuitars": FieldValue.arrayUnion(guitar.id),
        });
        t.set(serialRef, { count: serial }, { merge: true });

        return { type: "guitar", guitar, newItem, newInventory, newFame, isNewToDex };
      } else {
        // Draw effect
        let effect: EffectDefinition;
        if (dailyPick?.kind === "effect") {
          effect = dailyPick.def;
        } else {
          const rarity = drawRarity(caseDef.probabilities);
          const pool = EFFECTS_BY_RARITY[rarity] || EFFECTS_BY_RARITY["Common"] || [];
          effect = pickBiased(pool, (e) => discoveredEffectIds.has(e.id));
        }
        const effectCondition = rollCondition();
        const effectYear = rollEffectYear(effect);
        const effectCountry = rollEffectCountry(effect);
        const effectRolled = rollEffectFeatures(effect.rarity, effect.type);
        const effectTraits = rollItemTraits(effect.rarity, "effect", effect.type);

        // Dex-new: first copy of this model ever pulled, as opposed to a duplicate.
        const isNewToDex = !discoveredEffectIds.has(effect.id);

        const effectSerialRef = firestore
          .collection("arsenalSerials")
          .doc(`effect-${effect.id}`) as DocumentReference;
        const effectSerialDoc = await t.get(effectSerialRef);
        const effectSerial = (effectSerialDoc.data()?.count || 0) + 1;

        const effectItem: EffectInventoryItem = {
          id: generateId(),
          effectId: effect.id,
          acquiredAt: Date.now(),
          isNew: true,
          year: effectYear,
          country: effectCountry,
          condition: effectCondition,
          serial: effectSerial,
          ...(effectRolled ? { stats: effectRolled.stats, features: effectRolled.features } : {}),
          ...(effectTraits ? { traits: effectTraits } : {}),
        };

        const newEffectInventory = [...(data.arsenal?.effectInventory || []), effectItem];

        t.update(userRef, {
          "statistics.fame": newFame,
          "arsenal.effectInventory": newEffectInventory,
          // Discovery is permanent — recorded on the pull, never removed on a sale.
          "arsenal.dexEffects": FieldValue.arrayUnion(effect.id),
        });
        t.set(effectSerialRef, { count: effectSerial }, { merge: true });

        return { type: "effect", effect, effectItem, newFame, isNewToDex };
      }
    });

    // Write activity log (panel only, no Discord)
    if (LOG_CASE_OPENS) try {
      const item = result.type === "guitar" ? result.guitar : result.effect;
      await firestore.collection("logs").add({
        type: "case_open",
        uid: userId,
        userName: capturedUserData?.displayName || "Unknown",
        avatarUrl: capturedUserData?.avatar || null,
        userAvatarFrame: capturedUserData?.statistics?.lvl ?? 0,
        timestamp: new Date().toISOString(),
        data: new Date().toISOString(),
        caseType,
        caseName: caseDef.name,
        itemType: result.type,
        itemName: item.name,
        itemBrand: item.brand,
        itemRarity: item.rarity,
        itemImageId: item.imageId,
        // Full rolled instance (condition/year/country/serial/stats/features) for the feed card + level.
        rolledItem: result.type === "guitar" ? result.newItem : result.effectItem,
      });
    } catch (logError) {
      console.error("[open-case] log write failed:", logError);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_FAME") {
      return res.status(400).json({ error: "Not enough Fame Points" });
    }
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[open-case]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
