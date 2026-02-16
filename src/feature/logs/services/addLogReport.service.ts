import type { AchievementList } from "feature/achievements/types";
import { formatDiscordMessage } from "feature/discordBot/formatters/formatDiscordMessage";
import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";
import { logger } from "feature/logger/Logger";
import {
  collection,
  doc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc, trackedSetDoc } from "utils/firebase/client/firestoreTracking";

export const firebaseAddLogReport = async (
  uid: string,
  data: string,
  points: number,
  newAchievements: AchievementList[],
  newLevel: { isNewLevel: boolean; level: number },
  timeSumary: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  },
  avatarUrl: string | undefined,
  planId?: string | null,
  songDetails?: {
    songId?: string;
    songTitle?: string;
    songArtist?: string;
  },
  streak?: number,
  skillPointsGained?: Record<string, number>,
  newRecords?: {
    maxPoints?: boolean;
    longestSession?: boolean;
    maxStreak?: boolean;
    newLevel?: boolean;
  },
  exerciseRecords?: {
    micHighScore?: { exerciseTitle: string; score: number; accuracy: number };
    earTrainingHighScore?: { exerciseTitle: string; score: number };
  },
  exerciseTitle?: string,
  micPerformance?: { score: number; accuracy: number },
  earTrainingPerformance?: { score: number }
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await trackedGetDoc(userDocRef);
  const userData = userSnapshot.data()!;
  const userName = userData.displayName;
  const userAvatarFrame = userData.selectedFrame ?? userData.statistics?.lbl ?? userData.statistics?.level ?? userData.statistics?.lvl ?? 0;

  const logData = {
    data,
    uid,
    userName,
    userAvatarFrame,
    points,
    newAchievements,
    newLevel,
    timestamp: new Date().toISOString(),
    timeSumary,
    avatarUrl: avatarUrl ?? null,
    planId,
    streak,
    ...(exerciseTitle && { exerciseTitle }),
    ...(micPerformance && { micPerformance }),
    ...(earTrainingPerformance && { earTrainingPerformance }),
    ...songDetails,
    ...(skillPointsGained && Object.keys(skillPointsGained).length > 0 && { skillPointsGained }),
    ...(newRecords && { newRecords }),
    ...(exerciseRecords && { exerciseRecords }),
  };

  await trackedSetDoc(logsDocRef, logData);

  try {
    const discordMessage = await formatDiscordMessage(logData, "PL");
    await sendDiscordMessage(discordMessage as any);

    if (process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL_EN) {
      const discordMessageEn = await formatDiscordMessage(logData, "EN");
      await sendDiscordMessage(
        discordMessageEn as any,
        process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL_EN
      );
    }
  } catch (error) {
    logger.error(error, {
      context: "addLogReport",
    });
  }
};
