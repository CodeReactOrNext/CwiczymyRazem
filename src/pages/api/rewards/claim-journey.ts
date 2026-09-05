import {
  rollCondition,
  rollItemFeatures,
  rollVintageYear,
} from "feature/arsenal/data/itemStats";
import { rollItemTraits } from "feature/arsenal/data/traits";
import type {
  InventoryItem,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";
import {
  getJourneyCompletion,
  getJourneyReward,
  journeyRewardId,
} from "feature/journey/data/journeyRewards";
import type { JourneyProgressDocument } from "feature/journey/types/journey.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { readRewardLedger } from "lib/rewards/rewardLedger";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Collects the reward for finishing a mastery roadmap.
 *
 * The client sends which module and nothing else. Whether it is actually
 * finished is re-derived here from `journeyProgress` — the same document the
 * path itself is drawn from — because the alternative is taking a browser's
 * word for a Legendary guitar.
 *
 * The model at the end of a module is fixed and printed on the card long before
 * anyone can claim it; the *copy* is rolled here, per player, exactly as a case
 * pull would roll it. Two players who finish the same roadmap own the same
 * instrument, not the same item.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, moduleId } = req.body as {
    idToken?: string;
    moduleId?: string;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (typeof moduleId !== "string" || !moduleId) {
    return res.status(400).json({ error: "Missing moduleId" });
  }

  const reward = getJourneyReward(moduleId);
  if (!reward?.guitar) return res.status(400).json({ error: "Unknown module" });

  const { payout, guitar } = reward;

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const rewardId = journeyRewardId(moduleId);

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    // Read outside the transaction: the progress document is written only by
    // the path itself, and holding a second collection inside would make every
    // step completion contend with a claim that happens once per module, ever.
    const progressDoc = await firestore
      .collection("journeyProgress")
      .doc(userId)
      .get();
    const progress = progressDoc.exists
      ? (progressDoc.data() as JourneyProgressDocument)
      : null;

    if (!getJourneyCompletion(moduleId, progress).isComplete) {
      throw new Error("UNFINISHED");
    }

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      // Every read before the first write — the serial counter included.
      const serialRef = firestore
        .collection("arsenalSerials")
        .doc(`guitar-${guitar.id}`) as DocumentReference;
      const serialDoc = await t.get(serialRef);

      const data = userDoc.data()!;
      const ledger = readRewardLedger(data);
      if (ledger.claimedJourneys.includes(rewardId)) {
        throw new Error("ALREADY_CLAIMED");
      }

      const serial = (serialDoc.data()?.count || 0) + 1;
      const rolled = rollItemFeatures(guitar);
      const rolledTraits = rollItemTraits(guitar.rarity, "guitar");

      const trophy: InventoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        guitarId: guitar.id,
        acquiredAt: Date.now(),
        isNew: true,
        year: rollVintageYear(guitar.yearFrom, guitar.yearTo),
        country:
          guitar.countries[Math.floor(Math.random() * guitar.countries.length)],
        condition: rollCondition(),
        serial,
        ...(rolled ? { stats: rolled.stats, features: rolled.features } : {}),
        ...(rolledTraits ? { traits: rolledTraits } : {}),
      };

      const newFame = (data.statistics?.fame || 0) + payout.fame;
      const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
      const newParts = addPartsToWallet(wallet, payout.parts);
      const inventory: InventoryItem[] = data.arsenal?.inventory ?? [];

      t.update(userRef, {
        "statistics.fame": newFame,
        "arsenal.parts": newParts,
        "arsenal.inventory": [...inventory, trophy],
        // Discovery is permanent, exactly as it is on a case pull.
        "arsenal.dexGuitars": FieldValue.arrayUnion(guitar.id),
        "rewards.claimedJourneys": FieldValue.arrayUnion(rewardId),
        "rewards.caseTokens": FieldValue.increment(payout.caseTokens),
      });
      t.set(serialRef, { count: serial }, { merge: true });

      return {
        rewardId,
        moduleId,
        reward: payout,
        guitar,
        trophy,
        newFame,
        newParts,
        caseTokens: ledger.caseTokens + payout.caseTokens,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNFINISHED") {
      return res
        .status(400)
        .json({ error: "Finish every step of the roadmap first" });
    }
    if (message === "ALREADY_CLAIMED") {
      return res.status(400).json({ error: "Reward already collected" });
    }
    if (message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[rewards/claim-journey]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
