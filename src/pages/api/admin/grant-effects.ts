import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import {
  rollEffectCountry,
  rollEffectFeatures,
  rollEffectYear,
} from "feature/arsenal/data/effectStats";
import { rollCondition } from "feature/arsenal/data/itemStats";
import { rollItemTraits } from "feature/arsenal/data/traits";
import type { EffectInventoryItem } from "feature/arsenal/types/arsenal.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Hands a player pedals straight from the catalogue.
 *
 * A back-office tool, not a game mechanic: nothing is charged, nothing is
 * rolled for rarity, and the caller names exactly which models to grant. It
 * exists so new gear can be put in a real account and looked at on a real
 * pedalboard before it ships.
 *
 * The *instances* are rolled exactly as a case pull rolls them — same year,
 * country, condition, feature and trait draws, and the same global serial
 * counter — so a granted pedal is indistinguishable from an earned one and
 * cannot quietly skew the rig level with missing stats.
 *
 * Gated on `ADMIN_PASSWORD`, the same shared secret every other route under
 * `/api/admin` uses. Anyone holding it can mint gear into any account, so it
 * belongs to the same trust level as granting premium.
 */
function isAuthorized(req: NextApiRequest): boolean {
  const password = req.headers["x-admin-password"] ?? req.body?.password;
  return (
    !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, effectIds } = req.body as {
    userId?: string;
    effectIds?: (number | string)[];
  };

  if (!userId) return res.status(400).json({ error: "userId required" });
  if (!Array.isArray(effectIds) || effectIds.length === 0) {
    return res
      .status(400)
      .json({ error: "effectIds must be a non-empty array" });
  }

  const defs = effectIds.map((id) => EFFECTS_BY_ID.get(id));
  const unknown = effectIds.filter((_, i) => !defs[i]);
  if (unknown.length > 0) {
    return res
      .status(400)
      .json({ error: `Unknown effect ids: ${unknown.join(", ")}` });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      // Every read before the first write, serial counters included.
      const serialRefs = defs.map(
        (def) =>
          firestore
            .collection("arsenalSerials")
            .doc(`effect-${def!.id}`) as DocumentReference,
      );
      const serialDocs = await Promise.all(serialRefs.map((ref) => t.get(ref)));

      const data = userDoc.data()!;
      const granted: EffectInventoryItem[] = defs.map((def, i) => {
        const serial = (serialDocs[i].data()?.count || 0) + 1;
        const rolled = rollEffectFeatures(def!.rarity, def!.type);
        const traits = rollItemTraits(def!.rarity, "effect", def!.type);

        return {
          id: generateId(),
          effectId: def!.id,
          acquiredAt: Date.now(),
          isNew: true,
          year: rollEffectYear(def!),
          country: rollEffectCountry(def!),
          condition: rollCondition(),
          serial,
          ...(rolled ? { stats: rolled.stats, features: rolled.features } : {}),
          ...(traits ? { traits } : {}),
        };
      });

      const effectInventory: EffectInventoryItem[] =
        data.arsenal?.effectInventory ?? [];

      t.update(userRef, {
        "arsenal.effectInventory": [...effectInventory, ...granted],
        // Discovery is permanent, exactly as it is on a case pull.
        "arsenal.dexEffects": FieldValue.arrayUnion(...defs.map((d) => d!.id)),
      });
      serialRefs.forEach((ref, i) => {
        t.set(ref, { count: granted[i].serial }, { merge: true });
      });

      return {
        userId,
        displayName: data.displayName ?? null,
        granted: granted.map((item, i) => ({
          effectId: item.effectId,
          name: defs[i]!.name,
          brand: defs[i]!.brand,
          type: defs[i]!.type,
          rarity: defs[i]!.rarity,
          serial: item.serial,
          year: item.year,
          country: item.country,
        })),
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[admin/grant-effects]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
