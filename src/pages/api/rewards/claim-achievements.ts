import {
  getClaimableAchievements,
  previewClaim,
} from "feature/achievements/data/achievementRewards";
import type { AchievementList } from "feature/achievements/types";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { readRewardLedger } from "lib/rewards/rewardLedger";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Collects the reward on one badge, or on every badge waiting at once.
 *
 * The client sends ids and nothing else. What each id is worth is re-derived
 * here from the registry, and whether it is owed at all is decided against the
 * stored document — a body naming a badge the account has not earned, or one it
 * has already been paid for, simply drops out of the list instead of being
 * refused, so a stale panel claiming an old batch still pays the right amount.
 *
 * The whole batch lands in one transaction, so a claim either pays out and is
 * written off the ledger together, or does neither.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, achievementIds } = req.body as {
    idToken?: string;
    /** Omitted means "everything waiting". */
    achievementIds?: AchievementList[];
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (achievementIds !== undefined && !Array.isArray(achievementIds)) {
    return res.status(400).json({ error: "Invalid achievementIds" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      const ledger = readRewardLedger(data);
      const earned: AchievementList[] = data.statistics?.achievements ?? [];

      const waiting = getClaimableAchievements(
        earned,
        ledger.claimedAchievements,
      );
      const asked = achievementIds ? new Set(achievementIds) : null;
      const target = asked ? waiting.filter((id) => asked.has(id)) : waiting;

      if (target.length === 0) throw new Error("NOTHING_TO_CLAIM");

      const reward = previewClaim(target);
      const currentFame: number = data.statistics?.fame || 0;
      const newFame = currentFame + reward.fame;
      const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
      const newParts = addPartsToWallet(wallet, reward.parts);
      const caseTokens = ledger.caseTokens + reward.caseTokens;

      t.update(userRef, {
        "statistics.fame": newFame,
        "arsenal.parts": newParts,
        // Written as a union rather than as the array read above: a claim landing
        // beside a report that has just granted another badge must not roll that
        // badge's arrival back out of the document.
        "rewards.claimedAchievements": FieldValue.arrayUnion(...target),
        "rewards.caseTokens": FieldValue.increment(reward.caseTokens),
      });

      return { claimed: target, reward, newFame, newParts, caseTokens };
    });

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOTHING_TO_CLAIM") {
      return res.status(400).json({ error: "Nothing left to claim" });
    }
    if (message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[achievements/claim]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
