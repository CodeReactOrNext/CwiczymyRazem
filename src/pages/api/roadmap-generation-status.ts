import { readTicket } from "lib/roadmaps/generation/generationTicket";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * What a paid generation is doing right now.
 *
 * The browser drives the pipeline one request at a time, so it already knows
 * which stage it asked for — except inside the review, where a rejected draft
 * turns into a second full rewrite that takes as long again with nothing on
 * screen to show for it. The ticket records that; this answers it, in one
 * small read polled every few seconds while the review call is out.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const player = await requirePlayer(req);
  if (!player.ok) {
    return res.status(player.status).json({ message: player.error });
  }

  const { ticketId } = req.body as { ticketId?: unknown };
  if (typeof ticketId !== "string" || !ticketId) {
    return res.status(400).json({ message: "Missing ticketId." });
  }

  try {
    const ticket = await readTicket(ticketId);

    // Somebody else's ticket answers "nothing to report" rather than 403: what
    // is being asked for is a label on a progress bar, and a caller who cannot
    // have it has nothing to do with a refusal either.
    if (!ticket || ticket.uid !== player.session.uid) {
      return res.status(200).json({ stage: null });
    }

    return res.status(200).json({ stage: ticket.progress?.stage ?? null });
  } catch (error) {
    console.error("[roadmap-generation-status]", error);
    return res.status(200).json({ stage: null });
  }
}
