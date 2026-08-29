import { readState } from "lib/community/communityGoal";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * This week's goal, its progress, next week's ballot and whether this player
 * may take the reward. Open to everyone signed in — the goal is the whole
 * community's, only the ballot is a supporter thing.
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
    const state = await readState(
      authResult.session.uid,
      authResult.session.isSupporter,
    );
    return res.status(200).json(state);
  } catch (error: any) {
    console.error("[community-goal]", error);
    return res.status(500).json({ error: "Failed to load the goal" });
  }
}
