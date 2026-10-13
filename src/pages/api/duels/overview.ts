import { authenticateDuelRequest, sendDuelError } from "lib/duels/duelApi";
import { getDuelOverview } from "lib/duels/duelServer";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The duels page in one request: the player's rating and record, what they
 * have running, how their recent duels ended, and the ranking.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userId = await authenticateDuelRequest(req, res);
  if (!userId) return;

  try {
    return res.status(200).json(await getDuelOverview(userId));
  } catch (error) {
    return sendDuelError(res, error, "overview");
  }
}
