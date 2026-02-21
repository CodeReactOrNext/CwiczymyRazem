import {
  collection,
  doc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc, trackedSetDoc } from "utils/firebase/client/firestoreTracking";
import { formatDiscordMessage } from "feature/discordBot/formatters/formatDiscordMessage";
import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";
import { logger } from "feature/logger/Logger";

export const firebaseAddQuestLog = async (uid: string) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userSnapshot = await trackedGetDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData) return;

    const userName = userData.displayName;
    const avatarUrl = userData.userInfo?.avatar || null;
    const userAvatarFrame = userData.selectedFrame ?? userData.statistics?.lvl ?? 0;

    const logsDocRef = doc(collection(db, "logs"));

    const logData = {
      type: "daily_quest_completed",
      data: "Completed all Daily Quests!",
      uid,
      userName,
      userAvatarFrame,
      avatarUrl,
      timestamp: new Date().toISOString(),
      points: 100, // Reward points
    };

    await trackedSetDoc(logsDocRef, logData);

    // Optional: Send to Discord
    try {
      const discordMessage = {
        embeds: [{
          author: {
            name: userName,
            url: `https://www.riff.quest/user/${uid}`,
            ...(avatarUrl && { icon_url: avatarUrl }),
          },
          title: "🌟 Daily Quests Completed!",
          description: `**${userName}** has finished all daily challenges! \n\n**+100 PKT** rewards claimed!`,
          color: 0xf1c40f, // Gold
          timestamp: new Date().toISOString(),
        }]
      };
      await sendDiscordMessage(discordMessage as any);
    } catch (e) {
      console.error("Discord quest log failed", e);
    }

  } catch (error) {
    logger.error(error, {
      context: "addQuestLog",
    });
  }
};
