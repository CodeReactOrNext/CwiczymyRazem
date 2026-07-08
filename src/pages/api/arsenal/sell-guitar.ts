import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemValue } from "feature/arsenal/data/itemStats";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, inventoryItemId } = req.body as {
    idToken: string;
    inventoryItemId: string;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!inventoryItemId) {
    return res.status(400).json({ error: "Missing inventoryItemId" });
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

    // Find the item to sell
    const itemIndex = inventory.findIndex((item: any) => item.id === inventoryItemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in inventory" });
    }

    const item = inventory[itemIndex];
    const guitarDef = GUITARS_BY_ID.get(item.guitarId);
    if (!guitarDef) {
      return res.status(404).json({ error: "Guitar definition not found" });
    }

    // Calculate fame reward from the instance's rolled stats (condition × vintage)
    const fameReward = getItemValue(item, guitarDef);

    // Remove item from inventory
    const newInventory = inventory.filter((_: any, i: number) => i !== itemIndex);

    // Clear equipped guitar if selling the equipped item
    let equippedGuitarId = data.arsenal?.equippedGuitarId;
    let equippedItemId = data.arsenal?.equippedItemId ?? null;
    const sellingEquipped = equippedItemId
      ? equippedItemId === item.id
      : equippedGuitarId === item.guitarId;
    if (sellingEquipped) {
      equippedGuitarId = null;
      equippedItemId = null;
    }

    // Clear the rig slot if selling a slotted guitar, and refresh the denormalized rig level
    const rig = data.arsenal?.rig ?? DEFAULT_RIG;
    const guitarSlots = (rig.guitarSlots ?? DEFAULT_RIG.guitarSlots).map(
      (slotId: string | null) => (slotId === item.id ? null : slotId)
    );
    const rigLevel = getRigLevel({
      inventory: newInventory,
      effectInventory: data.arsenal?.effectInventory ?? [],
      rig: { ...rig, guitarSlots },
    });

    // Update user data
    await userRef.update({
      "arsenal.inventory": newInventory,
      "arsenal.equippedGuitarId": equippedGuitarId,
      "arsenal.equippedItemId": equippedItemId,
      "arsenal.rig.guitarSlots": guitarSlots,
      "statistics.fame": (data.statistics?.fame || 0) + fameReward,
      rigLevel,
    });

    return res.status(200).json({ success: true, fameReward });
  } catch (error) {
    console.error("[sell-guitar]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
