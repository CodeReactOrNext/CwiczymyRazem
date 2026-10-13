import { authenticateDuelRequest, sendDuelError } from "lib/duels/duelApi";
import { getDuelForPlayer } from "lib/duels/duelServer";
import type { NextApiRequest, NextApiResponse } from "next";

/** One duel, as one of its two players sees it — what the duel session opens with. */
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
    return res.status(200).json(await getDuelForPlayer(userId, duelId));
  } catch (error) {
    return sendDuelError(res, error, "duel");
  }
}
