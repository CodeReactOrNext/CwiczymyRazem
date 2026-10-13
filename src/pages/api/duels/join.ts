import { authenticateDuelRequest, sendDuelError } from "lib/duels/duelApi";
import { joinDuelQueue, readDuelIdentity } from "lib/duels/duelServer";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Enters the duel queue: paired straight away with whoever has waited longest,
 * or left waiting as a ticket for the next player who joins.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userId = await authenticateDuelRequest(req, res);
  if (!userId) return;

  try {
    const result = await joinDuelQueue(await readDuelIdentity(userId));
    return res.status(200).json(result);
  } catch (error) {
    return sendDuelError(res, error, "join");
  }
}
