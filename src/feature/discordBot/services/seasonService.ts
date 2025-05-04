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
        logger.warn('No season data available', { 
          context: 'SeasonService',
           
        });
        return null;
      }

      const daysLeft = this.calculateDaysLeft(now, endDate);

      return {
        players,
        daysLeft,
      };
    } catch (error) {
      logger.error(error, { 
        context: "SeasonService",
      });
      return null;
    }
  }

  private calculateDaysLeft(startDate: Date, endDate: Date): number {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);
  }

  private getCurrentSeasonId(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  private async getTopSeasonalPlayers(
    seasonId: string,
    limit: number
  ): Promise<SeasonPlayer[]> {
    try {
      const seasonalUsersRef = collection(db, "seasons", seasonId, "users");
      const q = query(seasonalUsersRef, orderBy("points", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.slice(0, limit).map((doc) => ({
        displayName: doc.data().displayName,
        points: doc.data().points,
      }));
    } catch (error) {
      logger.error(error, { 
        context: "SeasonService.getTopSeasonalPlayers", 
      });
      return [];
    }
  }

  private async getSeasonEndDate(seasonId: string): Promise<Date | null> {
    try {
      const seasonDocRef = doc(db, "seasons", seasonId);
      const seasonDoc = await getDoc(seasonDocRef);

      if (!seasonDoc.exists()) {
        logger.warn(`Season ${seasonId} not found`, {
          context: "SeasonService.getSeasonEndDate" 
        });
        return null;
      }

      const endDate = seasonDoc.data().endDate;
      return new Date(endDate);
    } catch (error) {
      logger.error(error, { 
        context: "SeasonService.getSeasonEndDate", 
      });
      return null;
    }
  }
}