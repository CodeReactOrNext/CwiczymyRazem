import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { EFFECTS_BY_RARITY } from "feature/arsenal/data/effectDefinitions";
import type {
  CaseType,
  GuitarRarity,
  InventoryItem,
  EffectInventoryItem,
} from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";
import type { Transaction, DocumentReference } from "firebase-admin/firestore";

// 60% guitar, 40% effect
const GUITAR_CHANCE = 0.6;

function drawRarity(probabilities: Record<GuitarRarity, number>): GuitarRarity {
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, prob] of Object.entries(probabilities) as [GuitarRarity, number][]) {
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

  const { idToken, caseType } = req.body as { idToken: string; caseType: CaseType };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  const caseDef = CASE_DEFINITIONS[caseType];
  if (!caseDef) return res.status(400).json({ error: "Invalid case type" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore.collection("users").doc(userId) as DocumentReference;
    let capturedUserData: any = null;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      capturedUserData = data;
      const currentFame: number = data.statistics?.fame || 0;

      if (currentFame < caseDef.fameCost) throw new Error("INSUFFICIENT_FAME");

      const existingEquipped = data.arsenal?.equippedGuitarId ?? data.selectedGuitar ?? null;
      const newFame = currentFame - caseDef.fameCost;

      if (Math.random() < GUITAR_CHANCE) {
        // Draw guitar
        const rarity = drawRarity(caseDef.probabilities);
        const pool = GUITARS_BY_RARITY[rarity] || GUITARS_BY_RARITY["Common"];
        const guitar = pool[Math.floor(Math.random() * pool.length)];
        const year = Math.floor(Math.random() * (guitar.yearTo - guitar.yearFrom + 1)) + guitar.yearFrom;
        const country = guitar.countries[Math.floor(Math.random() * guitar.countries.length)];

        const newItem: InventoryItem = {
          id: generateId(),
          guitarId: guitar.id,
          acquiredAt: Date.now(),
          isNew: true,
          year,
          country,
        };

        const newInventory = [...(data.arsenal?.inventory || []), newItem];

        t.update(userRef, {
          "statistics.fame": newFame,
          "arsenal.inventory": newInventory,
          "arsenal.equippedGuitarId": existingEquipped,
        });

        return { type: "guitar", guitar, newItem, newInventory, newFame };
      } else {
        // Draw effect
        const rarity = drawRarity(caseDef.probabilities);
        const pool = EFFECTS_BY_RARITY[rarity] || EFFECTS_BY_RARITY["Common"] || [];
        const effect = pool[Math.floor(Math.random() * pool.length)];

        const effectItem: EffectInventoryItem = {
          id: generateId(),
          effectId: effect.id,
          acquiredAt: Date.now(),
          isNew: true,
        };

        const newEffectInventory = [...(data.arsenal?.effectInventory || []), effectItem];

        t.update(userRef, {
          "statistics.fame": newFame,
          "arsenal.effectInventory": newEffectInventory,
        });

        return { type: "effect", effect, effectItem, newFame };
      }
    });

    // Write activity log (panel only, no Discord)
    try {
      const item = result.type === "guitar" ? result.guitar : result.effect;
      await firestore.collection("logs").add({
        type: "case_open",
        uid: userId,
        userName: capturedUserData?.displayName || "Unknown",
        avatarUrl: capturedUserData?.avatar || null,
        userAvatarFrame: capturedUserData?.selectedFrame ?? capturedUserData?.statistics?.lvl ?? 0,
        timestamp: new Date().toISOString(),
        data: new Date().toISOString(),
        caseType,
        caseName: caseDef.name,
        itemType: result.type,
        itemName: item.name,
        itemBrand: item.brand,
        itemRarity: item.rarity,
        itemImageId: item.imageId,
      });
    } catch (logError) {
      console.error("[open-case] log write failed:", logError);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_FAME") {
      return res.status(400).json({ error: "Not enough Fame Points" });
    }
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[open-case]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
