import { runDuelCron } from "lib/duels/duelServer";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Every ten minutes: sweeps queue tickets nobody answered in 24 hours, reminds
 * players who have not played a duel that is about to end, and settles duels
 * whose 24 hours (plus the grace for a last run) are up — winner, ELO, and a
 * notification to both. A missed run is caught up by the next one; nothing is
 * ever settled twice.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const done = await runDuelCron();
  return res.status(200).json(done);
}
