import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import { logger } from "feature/logger/Logger";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export interface SeasonalAchievement {
  userId: string;
  seasonId: string;
  seasonName: string;
  place: number;
  points: number;
  achievedAt: Timestamp;
}

export const getUserSeasonalAchievements = async (userId: string): Promise<SeasonalAchievement[]> => {
  try {
    const achievementsRef = collection(db, "users", userId, "seasonalAchievements");
    const snapshot = await getDocs(achievementsRef);
    
    const achievements: SeasonalAchievement[] = [];
    snapshot.forEach((doc) => {
      achievements.push(doc.data() as SeasonalAchievement);
    });
    
    return achievements.sort((a, b) => b.achievedAt.toMillis() - a.achievedAt.toMillis());
  } catch (error) {
    logger.error("Error fetching user seasonal achievements", { 
      context: "seasonalAchievementsService",
      extra: { userId, error }
    });
    return [];
  }
};

export const assignSeasonalAchievements = async (
  topPlayers: TopPlayerData[],
  seasonId: string,
  seasonName: string
): Promise<number> => {
  try {
    const now = Timestamp.now();
    const batchCommits = [];
    let assignedCount = 0;
    
    const topFivePlayers = topPlayers.slice(0, 5);
    
    for (let i = 0; i < topFivePlayers.length; i++) {
      const player = topFivePlayers[i];
      const place = i + 1;
      
      if (!player.uid) {
        logger.error('Player missing UID when assigning seasonal achievement', { 
          context: "seasonalAchievementsService",
          extra: { player }
        });
        continue;
      }
      
      const achievementId = seasonId;
      const achievementRef = doc(db, "users", player.uid, "seasonalAchievements", achievementId);
      
      const achievement: SeasonalAchievement = {
        userId: player.uid,
        seasonId,
        seasonName,
        place,
        points: player.points || 0,
        achievedAt: now
      };
      
      batchCommits.push(setDoc(achievementRef, achievement));
      assignedCount++;
    }
    
    await Promise.all(batchCommits);
    logger.info('Seasonal achievements assigned successfully', { 
      context: "seasonalAchievementsService",
      extra: { 
        seasonId, 
        assignedCount, 
        topPlayers: topFivePlayers.map(p => ({ uid: p.uid, points: p.points, place: topPlayers.indexOf(p) + 1 }))
      }
    });
    
    return assignedCount;
  } catch (error) {
    logger.error('Error assigning seasonal achievements', { 
      context: "seasonalAchievementsService",
      extra: { seasonId, error }
    });
    return 0;
  }
};

export const hasSeasonalAchievement = async (userId: string, seasonId: string): Promise<boolean> => {
  try {
    const achievementRef = doc(db, "users", userId, "seasonalAchievements", seasonId);
    const snapshot = await getDoc(achievementRef);
    
    return snapshot.exists();
  } catch (error) {
    logger.error('Error checking if user has seasonal achievement', { 
      context: "seasonalAchievementsService",
      extra: { userId, seasonId, error }
    });
    return false;
  }
}; 