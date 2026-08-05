import {
  MONTHLY_RUNNING_COST,
  ROADMAP_RAISED_OFFSET,
  ROADMAP_TIERS,
} from "feature/roadmap/data/roadmap.data";
import { pickSupportVariant } from "feature/support/content/supportVariants";
import * as admin from "firebase-admin";
import { getFundingSnapshot } from "lib/funding/getFundingSnapshot";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const funding = await getFundingSnapshot();

    // The activity feed is visible to everyone, including people who already
    // gave — stop posting for the rest of the month once the cost is covered
    // (short pulses instead of constant presence).
    if (funding.raisedThisMonth >= MONTHLY_RUNNING_COST) {
      return res.status(200).json({ posted: false, reason: "monthly cost already covered" });
    }

    const totalRaised = Math.max(0, funding.totalRaised - ROADMAP_RAISED_OFFSET);
    const nextTierIndex = ROADMAP_TIERS.findIndex((t) => totalRaised < t.goal);
    const nextTier = nextTierIndex === -1 ? null : ROADMAP_TIERS[nextTierIndex];

    const metaRef = firestore.collection("meta").doc("supportAskFeed");
    const metaSnap = await metaRef.get();
    const shownCount = metaSnap.exists ? Number(metaSnap.data()?.shownCount ?? 0) : 0;
    const variant = pickSupportVariant(shownCount);

    await firestore.collection("logs").add({
      type: "support_ask_update",
      data: new Date().toISOString(),
      variant,
      raisedThisMonth: funding.raisedThisMonth,
      monthlyGoal: MONTHLY_RUNNING_COST,
      totalRaised,
      supporters: funding.supporters,
      nextTierLabel: nextTier?.label ?? null,
      nextTierAmountToGo: nextTier ? nextTier.goal - totalRaised : null,
      // Plain ISO string, matching every other `logs` writer (addQuestLog,
      // daily-top-players, etc.) — a real Firestore Timestamp here would
      // sort as a different value type in `orderBy("timestamp", "desc")`
      // and fall out of the feed's `limit(20)` window.
      timestamp: new Date().toISOString(),
    });

    await metaRef.set(
      {
        shownCount: shownCount + 1,
        lastPostedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ posted: true, variant });
  } catch (error) {
    console.error("Error posting support-ask activity update:", error);
    return res.status(500).json({ message: "Error posting support-ask activity update" });
  }
}
