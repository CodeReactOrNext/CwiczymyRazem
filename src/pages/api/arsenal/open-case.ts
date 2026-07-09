import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { EFFECTS_BY_RARITY } from "feature/arsenal/data/effectDefinitions";
import { rollEffectCountry, rollEffectFeatures, rollEffectYear } from "feature/arsenal/data/effectStats";
import { GUITARS_BY_RARITY } from "feature/arsenal/data/guitarDefinitions";
import { rollCondition, rollItemFeatures, rollVintageYear } from "feature/arsenal/data/itemStats";
import type {
  CaseType,
  EffectInventoryItem,
  GuitarRarity,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import type { DocumentReference,Transaction } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

// 60% guitar, 40% effect
const GUITAR_CHANCE = 0.6;

// Flip to false to silence the public activity feed (e.g. while testing).
const LOG_CASE_OPENS = true;

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
        const year = rollVintageYear(guitar.yearFrom, guitar.yearTo);
        const country = guitar.countries[Math.floor(Math.random() * guitar.countries.length)];
        const condition = rollCondition();
        const rolled = rollItemFeatures(guitar.rarity);

        // Mint a global, sequential serial number for this guitar model.
        // Read happens before any write, so it's transaction-safe.
        const serialRef = firestore
          .collection("arsenalSerials")
          .doc(`guitar-${guitar.id}`) as DocumentReference;
        const serialDoc = await t.get(serialRef);
        const serial = (serialDoc.data()?.count || 0) + 1;

        const newItem: InventoryItem = {
          id: generateId(),
          guitarId: guitar.id,
          acquiredAt: Date.now(),
          isNew: true,
          year,
          country,
          condition,
          serial,
          ...(rolled ? { stats: rolled.stats, features: rolled.features } : {}),
        };

        const newInventory = [...(data.arsenal?.inventory || []), newItem];

        t.update(userRef, {
          "statistics.fame": newFame,
          "arsenal.inventory": newInventory,
          "arsenal.equippedGuitarId": existingEquipped,
        });
        t.set(serialRef, { count: serial }, { merge: true });

        return { type: "guitar", guitar, newItem, newInventory, newFame };
      } else {
        // Draw effect
        const rarity = drawRarity(caseDef.probabilities);
        const pool = EFFECTS_BY_RARITY[rarity] || EFFECTS_BY_RARITY["Common"] || [];
        const effect = pool[Math.floor(Math.random() * pool.length)];
        const effectCondition = rollCondition();
        const effectYear = rollEffectYear(effect);
        const effectCountry = rollEffectCountry(effect);
        const effectRolled = rollEffectFeatures(effect.rarity, effect.type);

        const effectSerialRef = firestore
          .collection("arsenalSerials")
          .doc(`effect-${effect.id}`) as DocumentReference;
        const effectSerialDoc = await t.get(effectSerialRef);
        const effectSerial = (effectSerialDoc.data()?.count || 0) + 1;

        const effectItem: EffectInventoryItem = {
          id: generateId(),
          effectId: effect.id,
          acquiredAt: Date.now(),
          isNew: true,
          year: effectYear,
          country: effectCountry,
          condition: effectCondition,
          serial: effectSerial,
          ...(effectRolled ? { stats: effectRolled.stats, features: effectRolled.features } : {}),
        };

        const newEffectInventory = [...(data.arsenal?.effectInventory || []), effectItem];

        t.update(userRef, {
          "statistics.fame": newFame,
          "arsenal.effectInventory": newEffectInventory,
        });
        t.set(effectSerialRef, { count: effectSerial }, { merge: true });

        return { type: "effect", effect, effectItem, newFame };
      }
    });

    // Write activity log (panel only, no Discord)
    if (LOG_CASE_OPENS) try {
      const item = result.type === "guitar" ? result.guitar : result.effect;
      await firestore.collection("logs").add({
        type: "case_open",
        uid: userId,
        userName: capturedUserData?.displayName || "Unknown",
        avatarUrl: capturedUserData?.avatar || null,
        userAvatarFrame: capturedUserData?.statistics?.lvl ?? 0,
        timestamp: new Date().toISOString(),
        data: new Date().toISOString(),
        caseType,
        caseName: caseDef.name,
        itemType: result.type,
        itemName: item.name,
        itemBrand: item.brand,
        itemRarity: item.rarity,
        itemImageId: item.imageId,
        // Full rolled instance (condition/year/country/serial/stats/features) for the feed card + level.
        rolledItem: result.type === "guitar" ? result.newItem : result.effectItem,
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
