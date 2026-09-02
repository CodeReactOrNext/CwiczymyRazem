import { SEASON_FAME_REWARDS, SEASON_REWARD_PLACES } from "constants/seasonRewards";
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import { logger } from "feature/logger/Logger";
import {
  collection,
  doc,
  increment,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc, trackedGetDocs, trackedSetDoc } from "utils/firebase/client/firestoreTracking";

export interface SeasonalAchievement {
  seasonId: string;
  place: number;
  points: number;
  achievedAt: Timestamp;
}

export const getUserSeasonalAchievements = async (userId: string): Promise<SeasonalAchievement[]> => {
  try {
    const achievementsRef = collection(db, "users", userId, "seasonalAchievements");
    const snapshot = await trackedGetDocs(achievementsRef);

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
): Promise<number> => {
  try {
    const now = Timestamp.now();
    const batchCommits = [];
    let assignedCount = 0;

    const rankedPlayers = topPlayers.slice(0, SEASON_REWARD_PLACES);

    for (let i = 0; i < rankedPlayers.length; i++) {
      const player = rankedPlayers[i];
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
        seasonId,
        place,
        points: player.points || 0,
        achievedAt: now
      };

      batchCommits.push(trackedSetDoc(achievementRef, achievement));
      assignedCount++;
    }

    await Promise.all(batchCommits);
    logger.info('Seasonal achievements assigned successfully', {
      context: "seasonalAchievementsService",
      extra: {
        seasonId,
        assignedCount,
        topPlayers: rankedPlayers.map(p => ({ uid: p.uid, points: p.points, place: topPlayers.indexOf(p) + 1 }))
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

export const awardSeasonFame = async (
  topPlayers: TopPlayerData[],
  seasonId: string,
): Promise<void> => {
  const ranked = topPlayers.slice(0, SEASON_REWARD_PLACES);

  // Place is read off the ranked list *before* the placeholder filter: filtering
  // first and then using the map index would promote everyone below a dropped
  // seed player by one place, and hand them someone else's Fame.
  const updates = ranked
    .map((player, i) => ({ player, fame: SEASON_FAME_REWARDS[i] }))
    .filter(({ player }) => player.uid && !player.uid.startsWith("player-"))
    .map(({ player, fame }) => {
      const userRef = doc(db, "users", player.uid!);
      return updateDoc(userRef, { "statistics.fame": increment(fame) });
    });

  await Promise.all(updates);

  logger.info("Season fame awarded", {
    context: "seasonalAchievementsService",
    extra: { seasonId, count: updates.length },
  });
};

export const hasSeasonalAchievement = async (userId: string, seasonId: string): Promise<boolean> => {
  try {
    const achievementRef = doc(db, "users", userId, "seasonalAchievements", seasonId);
    const snapshot = await trackedGetDoc(achievementRef);

    return snapshot.exists();
  } catch (error) {
    logger.error('Error checking if user has seasonal achievement', {
      context: "seasonalAchievementsService",
      extra: { userId, seasonId, error }
    });
    return false;
  }
}; 