import {
  CASE_DEFINITIONS,
  CASE_PACK_SIZES,
} from "feature/arsenal/data/caseDefinitions";
import type { DailyPoolEntry } from "feature/arsenal/data/dailyCase";
import { getDailyPool } from "feature/arsenal/data/dailyCase";
import {
  rollEffectCountry,
  rollEffectFeatures,
  rollEffectYear,
} from "feature/arsenal/data/effectStats";
import {
  rollCondition,
  rollItemFeatures,
  rollVintageYear,
} from "feature/arsenal/data/itemStats";
import {
  EFFECT_MERGE,
  getMergeOffer,
  GUITAR_MERGE,
} from "feature/arsenal/data/merge";
import { rollItemTraits } from "feature/arsenal/data/traits";
import type {
  CaseDefinition,
  CaseType,
  EffectInventoryItem,
  GuitarRarity,
  InventoryItem,
  OpenCasePackResult,
  OpenCaseResult,
} from "feature/arsenal/types/arsenal.types";
import { buildDiscoveredSet } from "feature/arsenal/utils/dex";
import { hasPity, isAtLeast, readPity } from "feature/arsenal/utils/pity";
import { planDraws } from "feature/arsenal/utils/planDraws";
import type { OwnedComponent } from "feature/guitarBuilder/types/guitarBuilder.types";
import {
  getComponent,
  rollCaseComponent,
} from "feature/guitarBuilder/utils/components";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { readRewardLedger } from "lib/rewards/rewardLedger";
import { getSlatePool } from "lib/supporterCase/supporterCase";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

// Flip to false to silence the public activity feed (e.g. while testing).
const LOG_CASE_OPENS = true;

/** How many cases one request may open. 1 is the plain open; the rest are packs. */
const PACK_SIZES: number[] = [1, ...CASE_PACK_SIZES];

/** In a pack, only drops at or above this make it into the public feed. */
const PACK_FEED_RARITY: GuitarRarity = "Epic";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Thrown out of a transaction for the handler to turn into a status code. */
class CaseError extends Error {}

interface Opened {
  results: OpenCaseResult[];
  /** The account as it stood before the opens, for the activity feed. */
  userData: Record<string, any>;
}

/**
 * `count` opens of one case, in ONE transaction.
 *
 * A pack used to be `count` transactions in a row, each reading the whole user
 * document and writing the whole stash back, which is what made ×5 feel like a
 * wait and ×10 like a hang. Nothing about a draw needs the database — the
 * models, the pity counters and the pack guarantee are all arithmetic on what
 * the account already holds — so the draws are made in memory first, the serial
 * counters of every model drawn are read in one batch, and the lot is written
 * back once.
 *
 * The draws still see each other: a model pulled on the second open is already
 * discovered on the third, and the pity counters advance open by open, exactly
 * as they did when each open was its own request.
 */
async function openCases(
  userId: string,
  caseType: CaseType,
  caseDef: CaseDefinition,
  count: number,
  payWithToken: boolean,
): Promise<Opened> {
  const userRef = firestore
    .collection("users")
    .doc(userId) as DocumentReference;
  const isCurated = caseType === "daily" || caseType === "supporter";

  // The slate is a read of its own and does not depend on the account, so it
  // is fetched once, out here, instead of on every retry of the transaction.
  const curatedPool: DailyPoolEntry[] | null = isCurated
    ? caseType === "supporter"
      ? ((await getSlatePool()) as DailyPoolEntry[])
      : getDailyPool()
    : null;

  let capturedUserData: Record<string, any> = {};

  const results = await firestore.runTransaction(
    async (t: Transaction): Promise<OpenCaseResult[]> => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new CaseError("USER_NOT_FOUND");

      const data = userDoc.data()!;
      capturedUserData = data;
      const currentFame: number = data.statistics?.fame || 0;

      // A free case is worth more than the Fame the badge behind it also paid,
      // because it is spendable on the Elite pair as readily as on Standard —
      // the shelf's price ladder is exactly what a token ignores. That is also
      // why the Vault is closed to it: see `noFreeCase`.
      const freeCases = readRewardLedger(data).caseTokens;

      if (payWithToken && caseDef.noFreeCase)
        throw new CaseError("NO_FREE_CASE_HERE");
      if (payWithToken && freeCases < 1) throw new CaseError("NO_FREE_CASE");
      const totalCost = caseDef.fameCost * count;
      if (!payWithToken && currentFame < totalCost) {
        throw new CaseError("INSUFFICIENT_FAME");
      }

      const existingEquipped =
        data.arsenal?.equippedGuitarId ?? data.selectedGuitar ?? null;
      const caseTokens = payWithToken ? freeCases - 1 : freeCases;
      // Decremented rather than set, so a token granted by a claim that landed
      // mid-transaction is not quietly spent along with this one.
      const tokenSpend = payWithToken
        ? { "rewards.caseTokens": FieldValue.increment(-1) }
        : {};

      // What the Dex already has, for the new-item bias and the pity guarantees.
      // Built here from the stored document — the request body has no say in what
      // the player is deemed to own. The sets are fresh copies, and the draws
      // below add to them as they go.
      //
      // The Dex record, not the stash: a model the player pulled and later sold
      // stays discovered, so the bias keeps steering pulls toward the models
      // that have genuinely never come out of a case.
      const discoveredGuitars = buildDiscoveredSet(
        data.arsenal?.dexGuitars,
        data.arsenal?.inventory as InventoryItem[] | undefined,
        (i) => i.guitarId,
      );
      const discoveredEffects = buildDiscoveredSet(
        data.arsenal?.dexEffects,
        data.arsenal?.effectInventory as EffectInventoryItem[] | undefined,
        (i) => i.effectId,
      );

      // ─── Draw, in memory ───────────────────────────────────────────────────
      // Pure arithmetic on what the account already holds: see `planDraws`.
      const plan = planDraws({
        caseDef,
        count,
        discoveredGuitars,
        discoveredEffects,
        counters:
          hasPity(caseDef) && !isCurated
            ? readPity(data.casePity, caseDef)
            : undefined,
        curatedPool,
        rollPart: () => rollCaseComponent(caseDef.probabilities, Math.random),
      });
      const draws = plan.draws;
      const counters = plan.counters;

      // ─── Serial numbers: one batched read for every model drawn ────────────
      // Every read happens before any write, so this is transaction-safe.
      const serialRefs = new Map<string, DocumentReference>();
      for (const draw of draws) {
        if (draw.kind === "component") continue;
        const key = `${draw.kind}-${draw.def.id}`;
        if (!serialRefs.has(key)) {
          serialRefs.set(
            key,
            firestore
              .collection("arsenalSerials")
              .doc(key) as DocumentReference,
          );
        }
      }
      const serialCounts = new Map<string, number>();
      if (serialRefs.size > 0) {
        const snaps = await t.getAll(...serialRefs.values());
        for (const snap of snaps) {
          serialCounts.set(snap.id, snap.data()?.count || 0);
        }
      }
      const nextSerial = (kind: "guitar" | "effect", id: number | string) => {
        const key = `${kind}-${id}`;
        const serial = (serialCounts.get(key) ?? 0) + 1;
        serialCounts.set(key, serial);
        return serial;
      };

      // ─── Mint ──────────────────────────────────────────────────────────────
      const guitars: InventoryItem[] = [...(data.arsenal?.inventory || [])];
      const effects: EffectInventoryItem[] = [
        ...(data.arsenal?.effectInventory || []),
      ];
      const components: OwnedComponent[] = [
        ...(data.arsenal?.components || []),
      ];
      const newGuitarIds = new Set<number | string>();
      const newEffectIds = new Set<number | string>();

      const out: OpenCaseResult[] = draws.map((draw, i) => {
        // What the balance reads after this open, so each result carries its own.
        const fameAfter = payWithToken
          ? currentFame
          : currentFame - caseDef.fameCost * (i + 1);
        const base = {
          newFame: fameAfter,
          caseTokens,
          usedToken: payWithToken,
        };

        if (draw.kind === "component") {
          components.push(draw.item);
          return {
            ...base,
            type: "component",
            component: getComponent(draw.item.defId)!,
            componentItem: draw.item,
            isNewToDex: false,
          };
        }

        const extras = {
          ...(draw.pityHit ? { pityHit: draw.pityHit } : {}),
          ...(draw.pityAfter ? { pity: draw.pityAfter } : {}),
        };

        if (draw.kind === "guitar") {
          const guitar = draw.def;
          const rolled = rollItemFeatures(guitar);
          const rolledTraits = rollItemTraits(guitar.rarity, "guitar");
          const newItem: InventoryItem = {
            id: generateId(),
            guitarId: guitar.id,
            acquiredAt: Date.now(),
            isNew: true,
            year: rollVintageYear(guitar.yearFrom, guitar.yearTo),
            country:
              guitar.countries[
                Math.floor(Math.random() * guitar.countries.length)
              ],
            condition: rollCondition(),
            serial: nextSerial("guitar", guitar.id),
            ...(rolled
              ? { stats: rolled.stats, features: rolled.features }
              : {}),
            ...(rolledTraits ? { traits: rolledTraits } : {}),
          };
          guitars.push(newItem);
          newGuitarIds.add(guitar.id);
          return {
            ...base,
            type: "guitar",
            guitar,
            newItem,
            isNewToDex: draw.isNew,
            ...(!draw.isNew
              ? {
                  merge:
                    getMergeOffer(guitars, newItem.id, GUITAR_MERGE) ??
                    undefined,
                }
              : {}),
            ...extras,
          };
        }

        const effect = draw.def;
        const rolled = rollEffectFeatures(effect.rarity, effect.type);
        const rolledTraits = rollItemTraits(
          effect.rarity,
          "effect",
          effect.type,
        );
        const effectItem: EffectInventoryItem = {
          id: generateId(),
          effectId: effect.id,
          acquiredAt: Date.now(),
          isNew: true,
          year: rollEffectYear(effect),
          country: rollEffectCountry(effect),
          condition: rollCondition(),
          serial: nextSerial("effect", effect.id),
          ...(rolled ? { stats: rolled.stats, features: rolled.features } : {}),
          ...(rolledTraits ? { traits: rolledTraits } : {}),
        };
        effects.push(effectItem);
        newEffectIds.add(effect.id);
        return {
          ...base,
          type: "effect",
          effect,
          effectItem,
          isNewToDex: draw.isNew,
          ...(!draw.isNew
            ? {
                merge:
                  getMergeOffer(effects, effectItem.id, EFFECT_MERGE) ??
                  undefined,
              }
            : {}),
          ...extras,
        };
      });

      // ─── Write, once ───────────────────────────────────────────────────────
      t.update(userRef, {
        ...tokenSpend,
        "statistics.fame": payWithToken ? currentFame : currentFame - totalCost,
        // Written as one field so a retried transaction cannot half-apply it.
        ...(counters
          ? { casePity: { ...(data.casePity ?? {}), [caseDef.id]: counters } }
          : {}),
        ...(newGuitarIds.size > 0
          ? {
              "arsenal.inventory": guitars,
              "arsenal.equippedGuitarId": existingEquipped,
              // Discovery is permanent — recorded on the pull, never removed on a sale.
              "arsenal.dexGuitars": FieldValue.arrayUnion(...newGuitarIds),
            }
          : {}),
        ...(newEffectIds.size > 0
          ? {
              "arsenal.effectInventory": effects,
              "arsenal.dexEffects": FieldValue.arrayUnion(...newEffectIds),
            }
          : {}),
        ...(components.length !== (data.arsenal?.components || []).length
          ? { "arsenal.components": components }
          : {}),
      });
      for (const [key, ref] of serialRefs) {
        t.set(ref, { count: serialCounts.get(key) }, { merge: true });
      }

      return out;
    },
  );

  return { results, userData: capturedUserData };
}

/** Writes the activity-feed entry for one open (panel only, no Discord). */
async function logOpen(
  userId: string,
  userData: Record<string, any>,
  caseType: CaseType,
  caseDef: CaseDefinition,
  result: OpenCaseResult,
) {
  if (!LOG_CASE_OPENS) return;
  try {
    const base = {
      type: "case_open",
      uid: userId,
      userName: userData?.displayName || "Unknown",
      avatarUrl: userData?.avatar || null,
      userAvatarFrame: userData?.statistics?.lvl ?? 0,
      guildBadge: userData?.guildBadge ?? null,
      timestamp: new Date().toISOString(),
      data: new Date().toISOString(),
      caseType,
      caseName: caseDef.name,
    };
    if (
      result.type === "component" &&
      result.component &&
      result.componentItem
    ) {
      // A Guitar Builder part: the feed draws it from its def id + rolled level.
      await firestore.collection("logs").add({
        ...base,
        itemType: "component",
        itemName: result.component.name,
        itemBrand: "",
        itemRarity: result.component.rarity,
        itemImageId: result.component.id,
        component: {
          uid: result.componentItem.uid,
          defId: result.componentItem.defId,
          level: result.componentItem.level,
        },
      });
      return;
    }
    const item = result.type === "guitar" ? result.guitar : result.effect;
    if (!item) return;
    await firestore.collection("logs").add({
      ...base,
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
}

const rarityOfResult = (result: OpenCaseResult): GuitarRarity | null =>
  result.guitar?.rarity ?? result.effect?.rarity ?? null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, caseType, useToken, count } = req.body as {
    idToken: string;
    caseType: CaseType;
    /** Spend a free case instead of Fame. Any case on the shelf takes one except the Vault. */
    useToken?: boolean;
    /** 1 (default), 5 or 10. Packs are paid in Fame, never with a free case. */
    count?: number;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  const caseDef = CASE_DEFINITIONS[caseType];
  if (!caseDef) return res.status(400).json({ error: "Invalid case type" });

  const packSize = count === undefined ? 1 : Number(count);
  if (!PACK_SIZES.includes(packSize)) {
    return res.status(400).json({ error: "Invalid pack size" });
  }
  if (packSize > 1 && useToken === true) {
    return res
      .status(400)
      .json({ error: "A free case opens one case at a time" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { results, userData } = await openCases(
      userId,
      caseType,
      caseDef,
      packSize,
      useToken === true,
    );

    // Everything on the feed goes out together rather than one after another: a
    // pack that took one write per Epic would be waiting on the feed, not the
    // draw. A single open is always shown; in a pack only the notable pulls are.
    await Promise.all(
      results
        .filter((result) => {
          if (packSize === 1) return true;
          const rarity = rarityOfResult(result);
          return rarity ? isAtLeast(rarity, PACK_FEED_RARITY) : false;
        })
        .map((result) => logOpen(userId, userData, caseType, caseDef, result)),
    );

    if (packSize === 1) return res.status(200).json(results[0]);

    const last = results[results.length - 1];
    const pack: OpenCasePackResult = {
      results,
      newFame: last.newFame,
      caseTokens: last.caseTokens,
      requested: packSize,
    };
    return res.status(200).json(pack);
  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_FAME") {
      return res.status(400).json({ error: "Not enough Fame Points" });
    }
    if (error?.message === "NO_FREE_CASE") {
      return res.status(400).json({ error: "No free cases left" });
    }
    if (error?.message === "NO_FREE_CASE_HERE") {
      return res.status(400).json({ error: "A free case can't open this one" });
    }
    if (error?.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[open-case]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
