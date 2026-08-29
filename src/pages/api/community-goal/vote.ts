import { voteOnBallot } from "lib/community/communityGoal";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Burns a token onto one option of next week's ballot. Supporters only: this is
 * the thing the donation actually buys — which goal the whole app plays for.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authResult = await requireSupporter(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
    const { candidateId } = req.body as { candidateId?: string };
    const result = await voteOnBallot(authResult.session, candidateId ?? "");

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.state);
  } catch (error: any) {
    console.error("[community-goal/vote]", error);
    return res.status(500).json({ error: "Failed to save the vote" });
  }
}
