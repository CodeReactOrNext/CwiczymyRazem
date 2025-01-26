import type { AchievementList } from "assets/achievements/achievementsData";
import { formatDiscordMessage } from "feature/discordBot/formatters";
import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";
import {
  collection,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

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
  }
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userDocRef);
  const userName = userSnapshot.data()!.displayName;

  const logData = {
    data,
    uid,
    userName,
    points,
    newAchievements,
    newLevel,
    timestamp: new Date().toISOString(),
    timeSumary,
  };

  await setDoc(logsDocRef, logData);

  try {
    const discordMessage = await formatDiscordMessage(logData);
    await sendDiscordMessage(discordMessage as any);
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
};
