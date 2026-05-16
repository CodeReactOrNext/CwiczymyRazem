import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const RARITY_FAME_VALUES: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 5,
  Epic: 10,
  Legendary: 20,
  Mythic: 50,
};

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

    // Calculate fame reward
    const fameReward = RARITY_FAME_VALUES[guitarDef.rarity] || 0;

    // Remove item from inventory
    const newInventory = inventory.filter((_: any, i: number) => i !== itemIndex);

    // Clear equipped guitar if selling it
    let equippedGuitarId = data.arsenal?.equippedGuitarId;
    if (equippedGuitarId === item.guitarId) {
      equippedGuitarId = null;
    }

    // Update user data
    await userRef.update({
      "arsenal.inventory": newInventory,
      "arsenal.equippedGuitarId": equippedGuitarId,
      "statistics.fame": (data.statistics?.fame || 0) + fameReward,
    });

    return res.status(200).json({ success: true, fameReward });
  } catch (error) {
    console.error("[sell-guitar]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
