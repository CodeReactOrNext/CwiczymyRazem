import * as functions from "firebase-functions";
import { awardSeasonalBadges } from "../utils/firebase/client/firebase.utils";

export const handleSeasonEnd = functions.pubsub
  .schedule("0 0 1 * *") // Run at midnight on the first day of each month
  .timeZone("UTC")
  .onRun(async (context) => {
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const seasonId = `${previousMonth.getFullYear()}-${String(
      previousMonth.getMonth() + 1
    ).padStart(2, "0")}`;

    await awardSeasonalBadges(seasonId);
    return null;
  });
