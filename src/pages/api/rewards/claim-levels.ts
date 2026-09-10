import type {
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";
import {
  getClaimableLevels,
  levelRewardId,
} from "feature/progression/data/levelMilestones";
import { rollLevelReward } from "feature/progression/utils/levelRewards";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { readRewardLedger } from "lib/rewards/rewardLedger";
import { mergeRewardParts } from "lib/rewards/rewardPayout";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Pays out every rung the account has climbed and not been paid for.
 *
 * The client sends nothing but its token. It does not name the levels, it does
 * not say what they are worth, and it cannot ask for one it has not reached:
 * the account's level is read off `statistics.lvl` inside the transaction and
 * the whole owed list is derived from it, then re-derived into rewards by the
 * same pure function the screen prints them with.
 *
 * One transaction for the lot. A player arriving at level 60 with the ladder
 * newly extended is owed thirty-odd rungs, and thirty round trips — each one
 * able to fail on its own and leave the ledger half paid — is not a way to
 * hand somebody their back pay.
 *
 * Idempotent by construction: `rewards.claimedLevels` is Admin-only in
 * `firestore.rules`, and a rung already on it drops out of the owed list. Two
 * calls landing together cannot double-pay, because the second reads the
 * ledger the first wrote.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = req.body as { idToken?: string };
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

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
      const lvl: number = data.statistics?.lvl ?? 1;

      const owed = getClaimableLevels(lvl, ledger.claimedLevels);
      // Nothing owed is the ordinary case, not a failure: this runs on its own
      // after every session, so most calls have nothing to do.
      if (owed.length === 0) {
        return { levels: [], parts: [], mods: [], caseTokens: 0 };
      }

      const rewards = owed
        .map(rollLevelReward)
        .filter((reward): reward is NonNullable<typeof reward> => !!reward);

      const parts = mergeRewardParts(rewards.flatMap((r) => r.parts));
      const caseTokens = rewards.reduce((sum, r) => sum + r.caseTokens, 0);

      const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
      const newParts = addPartsToWallet(wallet, parts);

      // Mods land in the stash exactly as a teardown's would. The id carries
      // the rung, so a mod cannot collide with the same mod from another level.
      const stash: SalvagedMod[] = data.arsenal?.salvagedMods ?? [];
      const granted: SalvagedMod[] = rewards.flatMap((reward) =>
        reward.mods.map((mod) => ({
          id: `level:${reward.lvl}:${mod.featureId}`,
          featureId: mod.featureId,
          kind: mod.kind,
          points: mod.points,
          sourceName: `Level ${reward.lvl}`,
          salvagedAt: Date.now(),
        })),
      );

      t.update(userRef, {
        "arsenal.parts": newParts,
        ...(granted.length
          ? { "arsenal.salvagedMods": [...stash, ...granted] }
          : {}),
        // A union rather than the array read above: a claim landing beside a
        // report that has just paid another rung must not roll that one back.
        "rewards.claimedLevels": FieldValue.arrayUnion(
          ...rewards.map((reward) => levelRewardId(reward.lvl)),
        ),
        "rewards.caseTokens": FieldValue.increment(caseTokens),
      });

      return {
        levels: rewards.map((reward) => reward.lvl),
        parts,
        mods: granted,
        caseTokens,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[claim-levels]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
