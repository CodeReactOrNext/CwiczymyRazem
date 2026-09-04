import {
  getClaimableAchievements,
  previewClaim,
} from "feature/achievements/data/achievementRewards";
import type { AchievementList } from "feature/achievements/types";
import { readRewardLedger } from "lib/rewards/rewardLedger";
import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "utils/firebase/api/firebase.config";

/**
 * What this player still has to collect, and what is already spent.
 *
 * One read for every reward source there is. The badges themselves ride along
 * with the user document the client holds; what it cannot know on its own is
 * which of them have been paid for and how many free cases are left, both of
 * which live in a server-only field.
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
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "User not found" });

    const data = userDoc.data()!;
    const ledger = readRewardLedger(data);
    const earned: AchievementList[] = data.statistics?.achievements ?? [];
    const claimable = getClaimableAchievements(
      earned,
      ledger.claimedAchievements,
    );

    return res.status(200).json({
      caseTokens: ledger.caseTokens,
      achievements: {
        claimed: ledger.claimedAchievements,
        claimable,
        pending: previewClaim(claimable),
      },
      // Whether a box or a roadmap is *finished* is worked out client-side from
      // the progress each screen already holds; all either needs from here is
      // which of the finished ones have been paid for.
      scales: { claimed: ledger.claimedScales },
      journeys: { claimed: ledger.claimedJourneys },
      roadmaps: { claimed: ledger.claimedRoadmaps },
    });
  } catch (error) {
    console.error("[rewards/state]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
