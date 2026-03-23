import { EFFECTS_BY_RARITY } from "feature/arsenal/data/effectDefinitions";
import type { EffectInventoryItem, GuitarRarity } from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

const EFFECT_PACK_PROBABILITIES: Record<GuitarRarity, number> = {
  Common: 0.50,
  Uncommon: 0.30,
  Rare: 0.13,
  Epic: 0.05,
  Legendary: 0.015,
  Mythic: 0.005,
};

function drawRarity(): GuitarRarity {
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, prob] of Object.entries(EFFECT_PACK_PROBABILITIES) as [GuitarRarity, number][]) {
    cumulative += prob;
    if (roll < cumulative) return rarity;
  }
  return "Common";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = req.body as { idToken: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

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

    // Draw rarity, fallback to Common pool if rarity has no effects yet
    let rarity = drawRarity();
    let pool = EFFECTS_BY_RARITY[rarity];
    if (!pool || pool.length === 0) {
      pool = EFFECTS_BY_RARITY["Common"] || [];
      rarity = "Common";
    }
    if (pool.length === 0) return res.status(500).json({ error: "No effects defined" });

    const effect = pool[Math.floor(Math.random() * pool.length)];

    const newItem: EffectInventoryItem = {
      id: generateId(),
      effectId: effect.id,
      acquiredAt: Date.now(),
      isNew: true,
    };

    const currentEffectInventory: EffectInventoryItem[] = data.arsenal?.effectInventory || [];
    const newEffectInventory = [...currentEffectInventory, newItem];

    await userRef.update({ "arsenal.effectInventory": newEffectInventory });

    return res.status(200).json({ effect, newItem, newEffectInventory });
  } catch (error) {
    console.error("[open-effect-pack]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
