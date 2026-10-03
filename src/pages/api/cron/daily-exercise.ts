import { settleRecentDailyBoards } from "lib/dailyExercise/settleDailyBoard";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Daily at 01:05 UTC — five minutes after yesterday's board closes (its hour of
 * grace for sessions that ran over midnight) — pays its #1 their prize and
 * tells the whole top five where they finished. A missed run is caught up by
 * the next: settlement looks a few days back, and a day already paid is never
 * paid twice.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const settled = await settleRecentDailyBoards();
  return res.status(200).json({ settled });
}
