import {
  EFFECT_MERGE,
  GUITAR_MERGE,
  planMerge,
} from "feature/arsenal/data/merge";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import type {
  EffectInventoryItem,
  InventoryItem,
  MergeDuplicatesResult,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { getItemUses } from "feature/arsenal/utils/inUse";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/** One request can fold this many copies in. A pack of ten never needs more. */
const MAX_MERGE_BATCH = 50;

/**
 * Folds duplicates into the best copy of the same model.
 *
 * The client says which copies to fold away, never what they are worth or what
 * they land on: the target is the highest-level copy of the same model that is
 * not itself being folded, and the gain is the model's mint-rarity step, both
 * recomputed here from the stored stash (`data/merge`). Copies that are in
 * service, carry workshop levels or an earlier merge, or have nothing to land on
 * are skipped and stay where they are.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, kind, itemIds } = req.body as {
    idToken: string;
    kind: "guitar" | "effect";
    itemIds: string[];
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (kind !== "guitar" && kind !== "effect") {
    return res.status(400).json({ error: "Invalid kind" });
  }
  if (
    !Array.isArray(itemIds) ||
    itemIds.length === 0 ||
    itemIds.length > MAX_MERGE_BATCH ||
    !itemIds.every((id) => typeof id === "string" && id.length > 0)
  ) {
    return res.status(400).json({ error: "Invalid itemIds" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(
      async (t: Transaction): Promise<MergeDuplicatesResult> => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("USER_NOT_FOUND");
        const data = userDoc.data()!;

        const inventory: InventoryItem[] = data.arsenal?.inventory || [];
        const effectInventory: EffectInventoryItem[] =
          data.arsenal?.effectInventory || [];
        const rig = data.arsenal?.rig ?? DEFAULT_RIG;

        // Accounts that tracked the equipped guitar only by model id resolve to
        // the first matching copy, exactly as the inventory route does.
        const equippedGuitarId = data.arsenal?.equippedGuitarId ?? null;
        const equippedItemId: string | null =
          data.arsenal?.equippedItemId ??
          (equippedGuitarId != null
            ? (inventory.find((i) => i.guitarId === equippedGuitarId)?.id ??
              null)
            : null);

        const requested = [...new Set(itemIds)];
        const blocked = new Set(
          requested.filter(
            (id) => getItemUses({ equippedItemId, rig }, id).length > 0,
          ),
        );

        if (kind === "guitar") {
          const plan = planMerge(inventory, requested, GUITAR_MERGE, blocked);
          if (plan.merged === 0) throw new Error("NOTHING_TO_MERGE");

          const rigLevel = getRigLevel({
            inventory: plan.items,
            effectInventory,
            rig,
          });
          t.update(userRef, { "arsenal.inventory": plan.items, rigLevel });
          return {
            kind,
            merged: plan.merged,
            gain: plan.gain,
            rigLevel,
            items: plan.raised,
          };
        }

        const plan = planMerge(
          effectInventory,
          requested,
          EFFECT_MERGE,
          blocked,
        );
        if (plan.merged === 0) throw new Error("NOTHING_TO_MERGE");

        const rigLevel = getRigLevel({
          inventory,
          effectInventory: plan.items,
          rig,
        });
        t.update(userRef, { "arsenal.effectInventory": plan.items, rigLevel });
        return {
          kind,
          merged: plan.merged,
          gain: plan.gain,
          rigLevel,
          items: plan.raised,
        };
      },
    );

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    if (code === "NOTHING_TO_MERGE") {
      return res.status(400).json({
        error:
          "Nothing to merge — a copy has to be spare, unbuilt and have another of the same model to go into",
      });
    }
    console.error("[merge-duplicates]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
