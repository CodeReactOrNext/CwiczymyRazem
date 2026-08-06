import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet, getEffectScrapYield } from "feature/arsenal/utils/scrap";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Tears a pedal down into parts. Like the guitar route, the yield is recomputed
 * server-side from the stored item.
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
    const effectInventory = data.arsenal?.effectInventory || [];

    const itemIndex = effectInventory.findIndex(
      (item: { id: string }) => item.id === inventoryItemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in inventory" });
    }

    const item = effectInventory[itemIndex];
    const effectDef = EFFECTS_BY_ID.get(item.effectId);
    if (!effectDef) {
      return res.status(404).json({ error: "Effect definition not found" });
    }

    // A pedal wired into the board has to come off it first.
    const pedalboardItems = data.arsenal?.rig?.pedalboardItems || [];
    if (pedalboardItems.some((pb: { itemId: string }) => pb.itemId === inventoryItemId)) {
      return res.status(400).json({ error: "Cannot scrap an effect that is on the pedalboard" });
    }

    const gained = getEffectScrapYield(item, effectDef);
    const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
    const newParts = addPartsToWallet(wallet, gained);

    const newEffectInventory = effectInventory.filter(
      (_: unknown, i: number) => i !== itemIndex
    );

    const rig = data.arsenal?.rig ?? DEFAULT_RIG;
    const rigLevel = getRigLevel({
      inventory: data.arsenal?.inventory ?? [],
      effectInventory: newEffectInventory,
      rig,
    });

    await userRef.update({
      "arsenal.effectInventory": newEffectInventory,
      "arsenal.parts": newParts,
      rigLevel,
    });

    return res.status(200).json({ success: true, parts: gained, newParts });
  } catch (error) {
    console.error("[scrap-effect]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
