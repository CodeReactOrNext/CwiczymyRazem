import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { getSalvageableMod, toSalvagedMod } from "feature/arsenal/data/salvage";
import { mergeScrapParts } from "feature/arsenal/data/scrapYield";
import type {
  InventoryItem,
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import {
  addPartsToWallet,
  getGuitarScrapYield,
} from "feature/arsenal/utils/scrap";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Tears down a whole batch of guitars — the duplicate sweep, scrapped instead of
 * sold. Same rules as the single-item route: the yield is recomputed here from
 * the stored items, and one fitted mod per instrument survives into the stash.
 *
 * The equipped guitar and anything in a rig slot are skipped rather than
 * rejected, exactly as the bulk sell does — a sweep must never quietly strip the
 * gear the player is using.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, inventoryItemIds } = req.body as {
    idToken: string;
    inventoryItemIds: string[];
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!Array.isArray(inventoryItemIds) || inventoryItemIds.length === 0) {
    return res.status(400).json({ error: "Missing inventoryItemIds" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists)
      return res.status(404).json({ error: "User not found" });

    const data = userDoc.data()!;
    const inventory = data.arsenal?.inventory || [];

    const equippedItemId: string | null = data.arsenal?.equippedItemId ?? null;
    const rigSlots: (string | null)[] = data.arsenal?.rig?.guitarSlots ?? [];
    const protectedIds = new Set<string>(
      [equippedItemId, ...rigSlots].filter((id): id is string => Boolean(id)),
    );

    const idsToScrap = new Set(inventoryItemIds);
    const yields: ScrapPart[][] = [];
    const salvagedMods: SalvagedMod[] = [...(data.arsenal?.salvagedMods ?? [])];
    let scrappedCount = 0;
    let salvagedCount = 0;

    const newInventory = inventory.filter((item: InventoryItem) => {
      if (!idsToScrap.has(item.id) || protectedIds.has(item.id)) return true;
      const guitarDef = GUITARS_BY_ID.get(item.guitarId);
      if (!guitarDef) return true; // keep items we cannot value

      yields.push(getGuitarScrapYield(item, guitarDef));
      scrappedCount += 1;

      const salvageable = getSalvageableMod(item, "guitar");
      if (salvageable) {
        salvagedMods.push(
          toSalvagedMod(
            salvageable,
            item.id,
            `${guitarDef.brand} ${guitarDef.name}`,
          ),
        );
        salvagedCount += 1;
      }
      return false;
    });

    if (scrappedCount === 0) {
      return res.status(400).json({ error: "No scrappable items found" });
    }

    const gained = mergeScrapParts(yields);
    const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
    const newParts = addPartsToWallet(wallet, gained);

    // Nothing equipped or racked was touched, so the rig only needs its level
    // recomputed against the smaller inventory.
    const rig = data.arsenal?.rig ?? DEFAULT_RIG;
    const rigLevel = getRigLevel({
      inventory: newInventory,
      effectInventory: data.arsenal?.effectInventory ?? [],
      rig,
    });

    await userRef.update({
      "arsenal.inventory": newInventory,
      "arsenal.parts": newParts,
      "arsenal.salvagedMods": salvagedMods,
      rigLevel,
    });

    return res.status(200).json({
      success: true,
      parts: gained,
      newParts,
      scrappedCount,
      salvagedCount,
    });
  } catch (error) {
    console.error("[scrap-guitars-bulk]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
