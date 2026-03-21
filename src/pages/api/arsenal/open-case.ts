import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import type {
  CaseType,
  GuitarRarity,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

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
    const userRef = firestore.collection("users").doc(userId);

    const result = await firestore.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      const currentFame: number = data.statistics?.fame || 0;

      if (currentFame < caseDef.fameCost) throw new Error("INSUFFICIENT_FAME");

      // Draw rarity then pick random guitar of that rarity
      const rarity = drawRarity(caseDef.probabilities);
      const pool = GUITARS_BY_RARITY[rarity] || GUITARS_BY_RARITY["Common"];
      const guitar = pool[Math.floor(Math.random() * pool.length)];

      const newItem: InventoryItem = {
        id: generateId(),
        guitarId: guitar.id,
        acquiredAt: Date.now(),
        isNew: true,
      };

      const currentInventory: InventoryItem[] = data.arsenal?.inventory || [];
      const newInventory = [...currentInventory, newItem];

      // Starter migration: if first time opening, set equippedGuitarId from selectedGuitar
      const existingEquipped = data.arsenal?.equippedGuitarId ?? data.selectedGuitar ?? null;

      t.update(userRef, {
        "statistics.fame": currentFame - caseDef.fameCost,
        "arsenal.inventory": newInventory,
        "arsenal.equippedGuitarId": existingEquipped,
      });

      return { guitar, newItem, newInventory, newFame: currentFame - caseDef.fameCost };
    });

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
