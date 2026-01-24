import { formatDiscordMessage } from "feature/discordBot/formatters/formatDiscordMessage";
import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";
import { logger } from "feature/logger/Logger";
import type { FirebaseLogsRecordingsInterface } from "feature/logs/types/logs.type";
import {
  collection,
  doc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDoc, trackedSetDoc } from "utils/firebase/client/firestoreTracking";

export const firebaseAddRecordingLog = async (
  uid: string,
  videoUrl: string,
  recordingTitle: string,
  recordingDescription: string,
  recordingId: string,
  songTitle?: string | null,
  songArtist?: string | null,
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await trackedGetDoc(userDocRef);
  const userData = userSnapshot.data();

  if (!userData) {
    logger.error(`User not found for uid: ${uid}`, { context: "addRecordingLog" });
    return;
  }

  const logData: FirebaseLogsRecordingsInterface = {
    uid,
    userName: userData.displayName,
    userAvatarUrl: userData.photoURL || null,
    videoUrl,
    recordingTitle,
    recordingId: recordingId,
    recordingDescription,
    songTitle: songTitle || null,
    songArtist: songArtist || null,
    timestamp: new Date().toISOString(),
    type: "recording_added",
    data: videoUrl,
    avatarUrl: userData.photoURL || null,
    userAvatarFrame: userData.selectedFrame ?? userData.statistics?.level ?? userData.statistics?.lvl ?? 0,
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
      context: "addRecordingLog",
    });
  }
};
