import type { RoadmapTeaser } from "feature/supporterPanel/types/userRoadmaps.types";
import { buildRoadmapTeaser } from "lib/roadmaps/roadmapTeaser";
import { listUserRoadmaps } from "lib/roadmaps/userRoadmaps";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * The listing reads every roadmap and every progress document, so it is built
 * at most once per ten minutes per instance — the teaser is a shop window, and
 * nobody needs it to the minute.
 */
const CACHE_MS = 10 * 60 * 1000;
let cached: { at: number; teaser: RoadmapTeaser } | null = null;

/**
 * A glimpse of Player Roadmaps for any signed-in player: what the board is
 * about, without who wrote it or anything to open. The roadmaps themselves
 * stay behind /api/supporter/user-roadmaps.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const auth = await requirePlayer(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  try {
    if (!cached || Date.now() - cached.at > CACHE_MS) {
      // No viewer: private roadmaps never make it into the window.
      cached = {
        at: Date.now(),
        teaser: buildRoadmapTeaser(await listUserRoadmaps(null)),
      };
    }
    return res.status(200).json(cached.teaser);
  } catch (error) {
    console.error("[roadmaps/teaser]", error);
    return res.status(500).json({ error: "Failed to load the roadmaps" });
  }
}
