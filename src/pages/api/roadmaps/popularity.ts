import roadmaps from "data/roadmaps";
import {
  readRoadmapPopularity,
  type RoadmapPopularity,
} from "lib/roadmaps/roadmapPopularity";
import { requirePlayer } from "lib/support/supporterAuth";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The stored counts are good for a day; this only saves reading the seven
 * documents again for every player who opens the page within ten minutes.
 */
const CACHE_MS = 10 * 60 * 1000;
let cached: { at: number; popularity: RoadmapPopularity } | null = null;

/**
 * How many players are on each curated roadmap, for the number on its card.
 * Any signed-in player may ask: it is a count, with nobody's name in it.
 * (A player's roadmap gets its number from the board's own listing.)
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
      cached = {
        at: Date.now(),
        popularity: await readRoadmapPopularity(
          firestore,
          roadmaps.map((roadmap) => roadmap.id),
        ),
      };
    }
    return res.status(200).json(cached.popularity);
  } catch (error) {
    console.error("[roadmaps/popularity]", error);
    return res.status(500).json({ error: "Failed to load the popularity" });
  }
}
