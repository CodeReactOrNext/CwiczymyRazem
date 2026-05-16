import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
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
    const effectInventory = data.arsenal?.effectInventory || [];

    // Find the item to sell
    const itemIndex = effectInventory.findIndex((item: any) => item.id === inventoryItemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in inventory" });
    }

    const item = effectInventory[itemIndex];
    const effectDef = EFFECTS_BY_ID.get(item.effectId);
    if (!effectDef) {
      return res.status(404).json({ error: "Effect definition not found" });
    }

    // Check if effect is in pedalboard
    const pedalboardItems = data.arsenal?.rig?.pedalboardItems || [];
    if (pedalboardItems.some((pb: any) => pb.itemId === inventoryItemId)) {
      return res.status(400).json({ error: "Cannot sell effect that is on pedalboard" });
    }

    // Calculate fame reward
    const fameReward = RARITY_FAME_VALUES[effectDef.rarity] || 0;

    // Remove item from inventory
    const newEffectInventory = effectInventory.filter((_: any, i: number) => i !== itemIndex);

    // Update user data
    await userRef.update({
      "arsenal.effectInventory": newEffectInventory,
      "statistics.fame": (data.statistics?.fame || 0) + fameReward,
    });

    return res.status(200).json({ success: true, fameReward });
  } catch (error) {
    console.error("[sell-effect]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
