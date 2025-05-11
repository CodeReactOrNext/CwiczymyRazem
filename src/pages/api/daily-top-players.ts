import { SeasonService } from "feature/discordBot/services/seasonService";
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import { logger } from "feature/logger/Logger";
import { 
  assignSeasonalAchievements,
  hasSeasonalAchievement
} from "feature/profile/services/seasonalAchievementsService";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";

const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      result[key as keyof T] = obj[key];
    }
  });
  return result;
};

const fetchUserDataByDisplayName = async (
  displayName: string, 
  index: number
): Promise<TopPlayerData> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("displayName", "==", displayName));
    const userSnapshot = await getDocs(q);
    
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      const playerData: TopPlayerData = {
        uid: userDoc.id,
        displayName,
        points: 0,
        level: userData.level || 1,
        avatar: userData.avatar || null,
      };
      
      return playerData;
    }
    
   
    return {
      uid: `player-${index}`,
      displayName,
      points: 0,
      level: 1,
    };
  } catch (error) {
    logger.warn(`Could not fetch user data for ${displayName}`, {
      context: "dailyTopPlayersUpdate"
    });
    
    return {
      uid: `player-${index}`,
      displayName,
      points: 0,
      level: 1,
    };
  }
};


const createLogData = (
  topPlayers: TopPlayerData[], 
  daysLeftInSeason: number
) => {
  return removeUndefined({
    type: "top_players_update",
    data: new Date().toISOString(),
    topPlayers,
    daysLeftInSeason
  });
};


const checkSeasonEndAndAssignAchievements = async (
  topPlayers: TopPlayerData[],
  seasonData: { daysLeft: number }
): Promise<void> => {
  if (false) {
    return;
  }

  const now = new Date();
  const seasonId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seasonName = seasonId;
  
  logger.info("Season is ending, assigning achievements", {
    context: "dailyTopPlayersUpdate",
    extra: {
      seasonId,
      topPlayersCount: topPlayers.length
    }
  });

  const topFivePlayers = topPlayers.slice(0, 5);
  const playersWithoutAchievements = [];
  
  for (const player of topFivePlayers) {
    if (!player.uid || player.uid.startsWith('player-')) {
      continue;
    }
    
    const hasAchievement = await hasSeasonalAchievement(player.uid, seasonId);
    if (!hasAchievement) {
      playersWithoutAchievements.push(player);
    }
  }
  
  if (playersWithoutAchievements.length === 0) {
    logger.info("All top players already have achievements for this season", {
      context: "dailyTopPlayersUpdate",
      extra: { seasonId }
    });
    return;
  }

  const assignedCount = await assignSeasonalAchievements(
    topPlayers, 
    seasonId,
  );
  
  logger.info(`Assigned ${assignedCount} seasonal achievements`, {
    context: "dailyTopPlayersUpdate",
    extra: {
      seasonId
    }
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const seasonService = new SeasonService();
    const seasonData = await seasonService.getSeasonData(5);

    if (!seasonData || !seasonData.players.length) {
      logger.warn("No top players data available for daily update", { 
        context: "dailyTopPlayersUpdate" 
      });
      return res.status(404).json({ message: "Top players data not found" });
    }

    const topPlayers = await Promise.all(
      seasonData.players.map(async (player, index) => {
        const playerData = await fetchUserDataByDisplayName(player.displayName, index);
        
        return {
          ...playerData,
          points: player.points
        };
      })
    );

    await checkSeasonEndAndAssignAchievements(topPlayers, seasonData);

    const logsDocRef = doc(collection(db, "logs"));
    const logData = createLogData(topPlayers, seasonData.daysLeft);
    await setDoc(logsDocRef, logData);

    res.status(200).json({ message: "Daily top players update sent" });
  } catch (error) {
    logger.error(error, {
      context: "dailyTopPlayersUpdate",
    });
    res.status(500).json({ message: "Error sending daily top players update" });
  }
} 