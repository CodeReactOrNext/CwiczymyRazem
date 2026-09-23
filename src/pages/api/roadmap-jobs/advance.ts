import { advanceJob, readJobFor } from "lib/roadmaps/generation/backgroundJob";
import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/** Stops short of the 300 s function limit in vercel.json, with room for the last write. */
const RUN_FOR_MS = 250_000;

/**
 * Moves the player's own background generation forward for up to a few
 * minutes, while their tab is open to ask. Answers with where it got to; the
 * tab asks again until the job is done. If the cron or another tab is already
 * advancing it, this answers straight away with the job as it stands.
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
  if (typeof ticketId !== "string" || !ticketId) {
    return res.status(400).json({ message: "Missing ticketId." });
  }

  try {
    // Only the owner's tab may spend compute on a job.
    const own = await readJobFor(auth.session.uid, ticketId);
    if (!own) return res.status(404).json({ message: "No such generation." });
    if (own.status !== "running") return res.status(200).json({ job: own });

    const { ran, view } = await advanceJob(ticketId, Date.now() + RUN_FOR_MS);
    return res.status(200).json({ job: view, ran });
  } catch (error) {
    console.error("[roadmap-jobs/advance]", error);
    return res
      .status(500)
      .json({ message: "Could not advance the generation." });
  }
}
