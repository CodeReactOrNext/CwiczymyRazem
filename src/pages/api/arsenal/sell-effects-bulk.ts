import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectValue } from "feature/arsenal/data/effectStats";
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
    const effectInventory = data.arsenal?.effectInventory || [];

    // Effects placed on the pedalboard are never sold in a bulk action.
    const pedalboardItems = data.arsenal?.rig?.pedalboardItems || [];
    const protectedIds = new Set<string>(
      pedalboardItems.map((pb: any) => pb.itemId).filter(Boolean)
    );

    const idsToSell = new Set(inventoryItemIds);
    let fameReward = 0;
    let soldCount = 0;

    const newEffectInventory = effectInventory.filter((item: any) => {
      if (!idsToSell.has(item.id) || protectedIds.has(item.id)) return true;
      const effectDef = EFFECTS_BY_ID.get(item.effectId);
      if (!effectDef) return true; // keep items we cannot value
      fameReward += getEffectValue(effectDef);
      soldCount += 1;
      return false;
    });

    if (soldCount === 0) {
      return res.status(400).json({ error: "No sellable items found" });
    }

    await userRef.update({
      "arsenal.effectInventory": newEffectInventory,
      "statistics.fame": (data.statistics?.fame || 0) + fameReward,
    });

    return res.status(200).json({ success: true, fameReward, soldCount });
  } catch (error) {
    console.error("[sell-effects-bulk]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
