import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";
import { logger } from "feature/logger/Logger";
import {
  collection,
  doc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc, trackedSetDoc } from "utils/firebase/client/firestoreTracking";

export const firebaseAddExamPassedLog = async (
  uid: string,
  moduleId: string,
  moduleTitle: string,
  stepId: string,
  stepTitle: string,
  stars: 1 | 2 | 3,
  accuracy: number
) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userSnapshot = await trackedGetDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData) return;

    const userName = userData.displayName;
    const avatarUrl = userData.avatar || null;
    const userAvatarFrame = userData.statistics?.lvl ?? 0;

    const logsDocRef = doc(collection(db, "logs"));

    const logData = {
      type: "journey_exam_passed",
      data: `Passed the "${stepTitle}" exam!`,
      uid,
      userName,
      userAvatarFrame,
      avatarUrl,
      timestamp: new Date().toISOString(),
      moduleId,
      moduleTitle,
      stepId,
      stepTitle,
      stars,
      accuracy: Math.round(accuracy),
    };

    await trackedSetDoc(logsDocRef, logData);

    try {
      const discordMessage = {
        embeds: [{
          author: {
            name: userName,
            url: `https://riff.quest/user/${uid}`,
            ...(avatarUrl && { icon_url: avatarUrl }),
          },
          title: "🎸 Journey Exam Passed!",
          description: `**${userName}** passed the **${stepTitle}** exam with ${"⭐".repeat(stars)} (${Math.round(accuracy)}% accuracy)!`,
          color: 0x22c55e,
          timestamp: new Date().toISOString(),
        }]
      };
      await sendDiscordMessage(discordMessage as any);
    } catch (e) {
      console.error("Discord exam passed log failed", e);
    }

  } catch (error) {
    logger.error(error, {
      context: "addExamPassedLog",
    });
  }
};
