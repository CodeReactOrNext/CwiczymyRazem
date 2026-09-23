import {
  advanceJob,
  findIdleJobs,
} from "lib/roadmaps/generation/backgroundJob";
import type { NextApiRequest, NextApiResponse } from "next";

/** Stops short of the 300 s function limit in vercel.json. */
const RUN_FOR_MS = 250_000;

/**
 * Every minute: moves forward the roadmap generations nobody's tab is
 * advancing — the player closed it, or it crashed — one after another until
 * the time is up. Most minutes there is nothing to do, and it answers after a
 * single query.
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

  const deadline = Date.now() + RUN_FOR_MS;
  const ids = await findIdleJobs();
  const advanced: string[] = [];

  for (const id of ids) {
    if (Date.now() >= deadline) break;
    try {
      const { ran } = await advanceJob(id, deadline);
      if (ran) advanced.push(id);
    } catch (error) {
      console.error("[cron/roadmap-jobs]", id, error);
    }
  }

  return res.status(200).json({ idle: ids.length, advanced: advanced.length });
}
