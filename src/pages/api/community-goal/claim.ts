import { claimReward } from "lib/community/communityGoal";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Takes this week's reward. Open to every player who practised in the week the
 * goal was met — supporters chose the goal, but the payout belongs to everyone
 * who showed up for it. The server re-checks completion, attendance and whether
 * it has already paid, so the button is only ever a request.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requirePlayer(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
    const result = await claimReward(
      authResult.session.uid,
      authResult.session.isSupporter,
    );

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.state);
  } catch (error: any) {
    console.error("[community-goal/claim]", error);
    return res.status(500).json({ error: "Failed to claim the reward" });
  }
}
