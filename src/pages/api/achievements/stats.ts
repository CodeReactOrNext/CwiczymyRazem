import type { AchievementStatsDoc } from "lib/achievements/achievementStats";
import { ACHIEVEMENT_STATS_PATH } from "lib/achievements/achievementStats";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * How many players hold each badge.
 *
 * Read through here rather than straight from Firestore because `/config` has no
 * client rule — which is what keeps the counters unforgeable. The figures are
 * aggregate and name nobody, so the response needs no auth.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AchievementStatsDoc | { error: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [collection, docId] = ACHIEVEMENT_STATS_PATH.split("/");
    const snapshot = await firestore.collection(collection).doc(docId).get();

    // Absent until the first recount. An empty tally is the honest answer, and
    // `rateFromStats` reads `totalPlayers: 0` as "not counted yet" rather than
    // as "nobody holds anything".
    const stats: AchievementStatsDoc = snapshot.exists
      ? (snapshot.data() as AchievementStatsDoc)
      : { counts: {}, totalPlayers: 0, updatedAt: 0 };

    // The numbers move slowly and nothing here is per-user, so a shared cache
    // can hold them; the stale window keeps a cold cache off the database.
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");

    return res.status(200).json(stats);
  } catch (error) {
    console.error("achievement stats read failed:", error);
    return res.status(500).json({ error: "Could not read achievement stats" });
  }
}
