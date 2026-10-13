import { authenticateDuelRequest, sendDuelError } from "lib/duels/duelApi";
import { cancelDuelTicket } from "lib/duels/duelServer";
import type { NextApiRequest, NextApiResponse } from "next";

/** Takes a waiting ticket out of the queue, freeing its slot. */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userId = await authenticateDuelRequest(req, res);
  if (!userId) return;

  const { ticketId } = req.body as { ticketId?: string };
  if (typeof ticketId !== "string" || !ticketId) {
    return res.status(400).json({ error: "Missing ticket" });
  }

  try {
    const cancelled = await cancelDuelTicket(userId, ticketId);
    return res.status(200).json({ cancelled });
  } catch (error) {
    return sendDuelError(res, error, "cancel");
  }
}
