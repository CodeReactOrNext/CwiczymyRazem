import type {
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";
import {
  getLevelMilestone,
  levelRewardId,
} from "feature/progression/data/levelMilestones";
import { rollLevelReward } from "feature/progression/utils/levelRewards";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { readRewardLedger } from "lib/rewards/rewardLedger";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Collects what a level pays.
 *
 * The client sends the level and nothing else — never what it thinks it is
 * owed. Whether the account is actually there is read off `statistics.lvl` in
 * the same transaction that pays, and *what* the rung pays is re-derived from
 * the same pure function the ladder printed it with, so the screen and the
 * payout cannot disagree and a tampered request can only ever ask for the
 * reward it was going to be given anyway.
 *
 * One rung per call, and one rung per account forever: `rewards.claimedLevels`
 * is on the Admin-only side of `firestore.rules`, so the ledger cannot pay
 * itself.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, lvl } = req.body as { idToken: string; lvl: number };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (!Number.isInteger(lvl)) {
    return res.status(400).json({ error: "Missing level" });
  }

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const milestone = getLevelMilestone(lvl);
  if (!milestone?.payout) {
    return res.status(400).json({ error: "That level pays nothing" });
  }

  const reward = rollLevelReward(milestone);
  if (!reward)
    return res.status(400).json({ error: "That level pays nothing" });

  const rewardId = levelRewardId(lvl);

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      const ledger = readRewardLedger(data);
      if (ledger.claimedLevels.includes(rewardId)) {
        throw new Error("ALREADY_CLAIMED");
      }
      if ((data.statistics?.lvl ?? 1) < lvl) throw new Error("NOT_REACHED");

      const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
      const newParts = addPartsToWallet(wallet, reward.parts);

      // A rewarded mod lands in the stash exactly as a teardown's or the
      // trader's would — the ladder is another way to come by one, not another
      // kind of thing. The id is scoped to the rung, so a second claim could
      // not collide with the first even if one ever got through.
      const stash: SalvagedMod[] = data.arsenal?.salvagedMods ?? [];
      const granted: SalvagedMod[] = reward.mods.map((mod) => ({
        id: `level:${lvl}:${mod.featureId}`,
        featureId: mod.featureId,
        kind: mod.kind,
        points: mod.points,
        sourceName: `Level ${lvl}`,
        salvagedAt: Date.now(),
      }));

      t.update(userRef, {
        "arsenal.parts": newParts,
        ...(granted.length
          ? { "arsenal.salvagedMods": [...stash, ...granted] }
          : {}),
        "rewards.claimedLevels": FieldValue.arrayUnion(rewardId),
        "rewards.caseTokens": FieldValue.increment(reward.caseTokens),
      });

      return {
        rewardId,
        lvl,
        reward,
        mods: granted,
        newParts,
        caseTokens: ledger.caseTokens + reward.caseTokens,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ALREADY_CLAIMED") {
      return res.status(409).json({ error: "Already collected" });
    }
    if (message === "NOT_REACHED") {
      return res.status(400).json({ error: "You have not reached that level" });
    }
    if (message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[claim-level]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
