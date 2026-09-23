import {
  findRunningJob,
  readJobFor,
} from "lib/roadmaps/generation/backgroundJob";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Where a background generation is: the one named by `ticketId`, or — with no
 * id — the player's running one, which is how a tab opened later finds its
 * way back to a generation that kept going without it.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const auth = await requireSupporter(req);
  if (!auth.ok) return res.status(auth.status).json({ message: auth.error });

  const { ticketId } = req.body as { ticketId?: unknown };

  try {
    const job =
      typeof ticketId === "string" && ticketId
        ? await readJobFor(auth.session.uid, ticketId)
        : await findRunningJob(auth.session.uid);
    return res.status(200).json({ job });
  } catch (error) {
    console.error("[roadmap-jobs/status]", error);
    return res.status(500).json({ message: "Could not read the generation." });
  }
}
