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
  res: NextApiResponse,
) {
  const authHeader = req.headers.authorization;
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const metaRef = firestore.collection("meta").doc("supportAskFeed");
    const metaSnap = await metaRef.get();
    const meta = metaSnap.exists ? (metaSnap.data() ?? {}) : {};

    // Runs daily, so "once per UTC day" is the whole schedule — a Vercel retry, a redeploy
    // that re-fires the cron, or a manual curl must not stack a second card onto the feed.
    // `?force=1` is the escape hatch for testing the copy, and it only counts when the
    // secret is configured (i.e. the check above actually authenticated this call) —
    // otherwise the route would be an open "post another ask" button for anyone.
    const today = new Date().toISOString().slice(0, 10);
    const force = Boolean(process.env.CRON_SECRET) && req.query.force === "1";
    if (!force && meta.lastPostedDay === today) {
      return res
        .status(200)
        .json({ posted: false, reason: "already posted today" });
    }

    const funding = await getFundingSnapshot();

    // Covering the month's hosting doesn't end the funding need — the roadmap is unlocked
    // tier by tier — so the ask keeps running either way. What changes is the framing:
    // `isCovered` swaps the variant pool from "servers need help" to "help build the next
    // roadmap unlock", so the card never contradicts the covered progress bar next to it.
    const isCovered = funding.raisedThisMonth >= MONTHLY_RUNNING_COST;

    const totalRaised = Math.max(
      0,
      funding.totalRaised - ROADMAP_RAISED_OFFSET,
    );
    const nextTierIndex = ROADMAP_TIERS.findIndex((t) => totalRaised < t.goal);
    const nextTier = nextTierIndex === -1 ? null : ROADMAP_TIERS[nextTierIndex];
    // `findIndex` returns the count of tiers already below the total, which is exactly how
    // many are funded; -1 means every tier is.
    const tiersFunded =
      nextTierIndex === -1 ? ROADMAP_TIERS.length : nextTierIndex;

    const shownCount = Number(meta.shownCount ?? 0);
    const variant = pickSupportVariant(shownCount, isCovered);

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
      tiersFunded,
      tiersTotal: ROADMAP_TIERS.length,
      // Plain ISO string, matching every other `logs` writer (addQuestLog,
      // daily-top-players, etc.) — a real Firestore Timestamp here would
      // sort as a different value type in `orderBy("timestamp", "desc")`
      // and fall out of the feed's `limit(20)` window.
      timestamp: new Date().toISOString(),
    });

    await metaRef.set(
      {
        shownCount: shownCount + 1,
        lastPostedDay: today,
        lastPostedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return res.status(200).json({ posted: true, variant, isCovered });
  } catch (error) {
    console.error("Error posting support-ask activity update:", error);
    return res
      .status(500)
      .json({ message: "Error posting support-ask activity update" });
  }
}
