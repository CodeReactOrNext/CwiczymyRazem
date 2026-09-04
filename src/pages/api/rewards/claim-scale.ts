import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";
import {
  boxRewardId,
  getBoxCompletion,
  getBoxReward,
} from "feature/scaleTree/data/scaleTreeRewards";
import type { BpmProgressMap } from "feature/scaleTree/types/scaleTree.types";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { readRewardLedger } from "lib/rewards/rewardLedger";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * Collects the reward for finishing one box of a scale tree.
 *
 * The client sends which box and nothing else. Whether that row is actually
 * finished is re-derived here from `exerciseBpmProgress` — the same tempo
 * record the tree itself is drawn from — because the alternative is taking a
 * browser's word for a payout, and the browser is where the tree's status graph
 * happens to be computed.
 *
 * The progress read sits outside the transaction: it is a subcollection scan of
 * a document set only the practice logger writes, and holding it inside would
 * have made the whole scan a contention point for a claim that happens once per
 * scale, ever. The ledger check that actually guards the payout is inside.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, scaleType, position } = req.body as {
    idToken?: string;
    scaleType?: string;
    /** The fret the box is anchored at. */
    position?: number;
  };

  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  if (typeof scaleType !== "string" || !scaleType) {
    return res.status(400).json({ error: "Missing scaleType" });
  }
  if (!Number.isInteger(position)) {
    return res.status(400).json({ error: "Invalid position" });
  }

  const reward = getBoxReward(scaleType, position!);
  if (!reward) return res.status(400).json({ error: "Unknown box" });

  let userId: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const rewardId = boxRewardId(scaleType, position!);

  try {
    const userRef = firestore
      .collection("users")
      .doc(userId) as DocumentReference;

    const progressSnapshot = await userRef
      .collection("exerciseBpmProgress")
      .get();
    const progress: BpmProgressMap = new Map();
    progressSnapshot.forEach((doc) => {
      const bpms = doc.data()?.completedBpms;
      progress.set(doc.id, Array.isArray(bpms) ? bpms : []);
    });

    const completion = getBoxCompletion(scaleType, position!, progress);
    if (!completion.isComplete) throw new Error("UNFINISHED");

    const result = await firestore.runTransaction(async (t: Transaction) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

      const data = userDoc.data()!;
      const ledger = readRewardLedger(data);
      if (ledger.claimedScales.includes(rewardId)) {
        throw new Error("ALREADY_CLAIMED");
      }

      const newFame = (data.statistics?.fame || 0) + reward.fame;
      const wallet: ScrapPart[] = data.arsenal?.parts ?? [];
      const newParts = addPartsToWallet(wallet, reward.parts);

      t.update(userRef, {
        "statistics.fame": newFame,
        "arsenal.parts": newParts,
        "rewards.claimedScales": FieldValue.arrayUnion(rewardId),
        "rewards.caseTokens": FieldValue.increment(reward.caseTokens),
      });

      return {
        rewardId,
        scaleType,
        position,
        reward,
        newFame,
        newParts,
        caseTokens: ledger.caseTokens + reward.caseTokens,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNFINISHED") {
      return res
        .status(400)
        .json({ error: "Finish every shape in this box first" });
    }
    if (message === "ALREADY_CLAIMED") {
      return res.status(400).json({ error: "Reward already collected" });
    }
    if (message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[rewards/claim-scale]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
