import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { getSalvageableMod, toSalvagedMod } from "feature/arsenal/data/salvage";
import { mergeScrapParts } from "feature/arsenal/data/scrapYield";
import type {
  EffectInventoryItem,
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import {
  addPartsToWallet,
  getEffectScrapYield,
} from "feature/arsenal/utils/scrap";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * The pedal half of the duplicate sweep, torn down instead of sold. Pedals wired
 * into the board are skipped, the way the bulk sell skips them.
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
    const effectInventory = data.arsenal?.effectInventory || [];

    const pedalboardItems = data.arsenal?.rig?.pedalboardItems || [];
    const protectedIds = new Set<string>(
      pedalboardItems
        .map((pb: { itemId: string }) => pb.itemId)
        .filter(Boolean),
    );

    const idsToScrap = new Set(inventoryItemIds);
    const yields: ScrapPart[][] = [];
    const salvagedMods: SalvagedMod[] = [...(data.arsenal?.salvagedMods ?? [])];
    let scrappedCount = 0;
    let salvagedCount = 0;

    const newEffectInventory = effectInventory.filter(
      (item: EffectInventoryItem) => {
        if (!idsToScrap.has(item.id) || protectedIds.has(item.id)) return true;
        const effectDef = EFFECTS_BY_ID.get(item.effectId);
        if (!effectDef) return true; // keep items we cannot value

        yields.push(getEffectScrapYield(item, effectDef));
        scrappedCount += 1;

        const salvageable = getSalvageableMod(item, "effect");
        if (salvageable) {
          salvagedMods.push(
            toSalvagedMod(
              salvageable,
              item.id,
              `${effectDef.brand} ${effectDef.name}`,
            ),
          );
          salvagedCount += 1;
        }
        return false;
      },
    );

    if (scrappedCount === 0) {
      return res.status(400).json({ error: "No scrappable items found" });
    }

    const gained = mergeScrapParts(yields);
    const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
    const newParts = addPartsToWallet(wallet, gained);

    const rig = data.arsenal?.rig ?? DEFAULT_RIG;
    const rigLevel = getRigLevel({
      inventory: data.arsenal?.inventory ?? [],
      effectInventory: newEffectInventory,
      rig,
    });

    await userRef.update({
      "arsenal.effectInventory": newEffectInventory,
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
    console.error("[scrap-effects-bulk]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
