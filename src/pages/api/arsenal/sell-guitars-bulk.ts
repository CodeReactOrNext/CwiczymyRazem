import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemValue } from "feature/arsenal/data/itemStats";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const data = userDoc.data()!;
    const inventory = data.arsenal?.inventory || [];

    // Items that must never be sold in a bulk action: the equipped guitar and
    // anything currently placed in a rig slot.
    const equippedItemId: string | null = data.arsenal?.equippedItemId ?? null;
    const rigSlots: (string | null)[] = data.arsenal?.rig?.guitarSlots ?? [];
    const protectedIds = new Set<string>(
      [equippedItemId, ...rigSlots].filter((id): id is string => Boolean(id))
    );

    const idsToSell = new Set(inventoryItemIds);
    let fameReward = 0;
    let soldCount = 0;

    const newInventory = inventory.filter((item: any) => {
      if (!idsToSell.has(item.id) || protectedIds.has(item.id)) return true;
      const guitarDef = GUITARS_BY_ID.get(item.guitarId);
      if (!guitarDef) return true; // keep items we cannot value
      fameReward += getItemValue(item, guitarDef);
      soldCount += 1;
      return false;
    });

    if (soldCount === 0) {
      return res.status(400).json({ error: "No sellable items found" });
    }

    await userRef.update({
      "arsenal.inventory": newInventory,
      "statistics.fame": (data.statistics?.fame || 0) + fameReward,
    });

    return res.status(200).json({ success: true, fameReward, soldCount });
  } catch (error) {
    console.error("[sell-guitars-bulk]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
