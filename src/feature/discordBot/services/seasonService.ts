import { logger } from "feature/logger/Logger";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import type { SeasonData, SeasonPlayer } from "../types/season.types";

export class SeasonService {
  async getSeasonData(limit: number = 5): Promise<SeasonData | null> {
    const now = new Date();
    const seasonId = this.getCurrentSeasonId(now);

    try {
      const [players, endDate] = await Promise.all([
        this.getTopSeasonalPlayers(seasonId, limit),
        this.getSeasonEndDate(seasonId),
      ]);

      if (!endDate || players.length === 0) {
        return null;
      }

      const daysLeft = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        players,
        daysLeft,
      };
    } catch (error) {
      logger.error(error, { context: "SeasonService" });
      return null;
    }
  }

  private getCurrentSeasonId(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  }

  private async getTopSeasonalPlayers(
    seasonId: string,
    limit: number
  ): Promise<SeasonPlayer[]> {
    const seasonalUsersRef = collection(db, "seasons", seasonId, "users");
    const q = query(seasonalUsersRef, orderBy("points", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.slice(0, limit).map((doc) => ({
      displayName: doc.data().displayName,
      points: doc.data().points,
    }));
  }

  private async getSeasonEndDate(seasonId: string): Promise<Date | null> {
    const seasonDocRef = doc(db, "seasons", seasonId);
    const seasonDoc = await getDoc(seasonDocRef);

    if (!seasonDoc.exists()) {
      return null;
    }

    const endDate = seasonDoc.data().endDate;
    return new Date(endDate);
  }
}
