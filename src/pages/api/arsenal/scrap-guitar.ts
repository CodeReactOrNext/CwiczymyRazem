import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet, getGuitarScrapYield } from "feature/arsenal/utils/scrap";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Tears a guitar down into parts. The yield is recomputed here from the stored
 * item — the client only says *which* item, never what it should get.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, inventoryItemId } = req.body as {
    idToken: string;
    inventoryItemId: string;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!inventoryItemId) return res.status(400).json({ error: "Missing inventoryItemId" });

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

    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const data = userDoc.data()!;
    const inventory = data.arsenal?.inventory || [];

    const itemIndex = inventory.findIndex(
      (item: { id: string }) => item.id === inventoryItemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in inventory" });
    }

    const item = inventory[itemIndex];
    const guitarDef = GUITARS_BY_ID.get(item.guitarId);
    if (!guitarDef) {
      return res.status(404).json({ error: "Guitar definition not found" });
    }

    const gained = getGuitarScrapYield(item, guitarDef);
    const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
    const newParts = addPartsToWallet(wallet, gained);

    const newInventory = inventory.filter((_: unknown, i: number) => i !== itemIndex);

    // Scrapping the equipped guitar clears the profile slot.
    let equippedGuitarId = data.arsenal?.equippedGuitarId;
    let equippedItemId = data.arsenal?.equippedItemId ?? null;
    const scrappingEquipped = equippedItemId
      ? equippedItemId === item.id
      : equippedGuitarId === item.guitarId;
    if (scrappingEquipped) {
      equippedGuitarId = null;
      equippedItemId = null;
    }

    // Same for a rig slot, then refresh the denormalized rig level.
    const rig = data.arsenal?.rig ?? DEFAULT_RIG;
    const guitarSlots = (rig.guitarSlots ?? DEFAULT_RIG.guitarSlots).map(
      (slotId: string | null) => (slotId === item.id ? null : slotId)
    );
    const rigLevel = getRigLevel({
      inventory: newInventory,
      effectInventory: data.arsenal?.effectInventory ?? [],
      rig: { ...rig, guitarSlots },
    });

    await userRef.update({
      "arsenal.inventory": newInventory,
      "arsenal.parts": newParts,
      "arsenal.equippedGuitarId": equippedGuitarId,
      "arsenal.equippedItemId": equippedItemId,
      "arsenal.rig.guitarSlots": guitarSlots,
      rigLevel,
    });

    return res.status(200).json({ success: true, parts: gained, newParts });
  } catch (error) {
    console.error("[scrap-guitar]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
