import { doc, getDoc, setDoc } from "firebase/firestore";
import type { SeasonDataInterface } from "types/api.types";
import { db } from "utils/firebase/client/firebase.utils";

/**
 * The season everyone is currently ranked in — one calendar month, in UTC.
 *
 * UTC is not incidental here. This function runs on both sides: the leaderboard
 * calls it in the player's browser, and the report route calls it on the server
 * when deciding which season a session's points belong to. Deriving the id from
 * the host's local calendar therefore gave two different answers for part of
 * every month boundary — a player in UTC+10 opening the board just after their
 * local midnight on the 1st was shown the new season while their points were
 * still being written into the old one, and the client's `setDoc` below would
 * happily create next month's season document ten hours early, stamped with
 * start and end dates taken from that same wrong clock.
 */
const getSeasonId = (now: Date): string =>
  `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

export const getCurrentSeason = async () => {
  try {
    const now = new Date();
    const seasonId = getSeasonId(now);

    const seasonRef = doc(db, "seasons", seasonId);
    const seasonDoc = await getDoc(seasonRef);

    if (!seasonDoc.exists()) {
      const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      // Day zero of the next month is the last day of this one.
      const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

      const seasonData = {
        seasonId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isActive: true,
        name: `Season ${seasonId}`,
      };

      await setDoc(seasonRef, seasonData);
      return seasonData;
    }

    return { seasonId, ...seasonDoc.data() } as SeasonDataInterface;
  } catch (error) {
    throw error;
  }
};
