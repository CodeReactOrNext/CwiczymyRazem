import { authenticateDuelRequest, sendDuelError } from "lib/duels/duelApi";
import { markDuelReady } from "lib/duels/duelServer";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Ready: locks the player's best in. When the opponent is ready already, the
 * duel is settled right here instead of at the deadline.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userId = await authenticateDuelRequest(req, res);
  if (!userId) return;

  const { duelId } = req.body as { duelId?: string };
  if (typeof duelId !== "string" || !duelId) {
    return res.status(400).json({ error: "Missing duel" });
  }

  try {
    return res.status(200).json(await markDuelReady(userId, duelId));
  } catch (error) {
    return sendDuelError(res, error, "ready");
  }
}
