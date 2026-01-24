import { formatDiscordMessage } from "feature/discordBot/formatters/formatDiscordMessage";
import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";
import { logger } from "feature/logger/Logger";
import type { FirebaseLogsSongsStatuses } from "feature/logs/types/logs.type";
import {
  collection,
  doc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc, trackedSetDoc } from "utils/firebase/client/firestoreTracking";



export const firebaseAddSongsLog = async (
  uid: string,
  data: string,
  songTitle: string,
  songArtist: string,
  status: FirebaseLogsSongsStatuses,
  avatarUrl: string | undefined,
  difficulty_rate: number | undefined,

) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await trackedGetDoc(userDocRef);
  const userData = userSnapshot.data()!;
  const userName = userData.displayName;
  const userAvatarFrame = userData.selectedFrame ?? userData.statistics?.level ?? userData.statistics?.lvl ?? 0;

  const logData = {
    data,
    uid,
    userName,
    songTitle,
    songArtist,
    status,
    avatarUrl,
    userAvatarFrame,
  };

  await trackedSetDoc(logsDocRef, logData);

  try {
    const discordMessage = await formatDiscordMessage(
      {
        ...logData,
        difficulty_rate,
      },
      "PL"
    );
    await sendDiscordMessage(discordMessage as any);

    if (process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL_EN) {
      const discordMessageEn = await formatDiscordMessage(
        {
          ...logData,
          difficulty_rate,
        },
        "EN"
      );
      await sendDiscordMessage(
        discordMessageEn as any,
        process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL_EN
      );
    }
  } catch (error) {
    logger.error(error, {
      context: "addSongsLog",
    });
  }
};
