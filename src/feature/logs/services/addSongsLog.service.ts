import { formatDiscordMessage } from "feature/discordBot/formatters";
import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";
import type { FirebaseLogsSongsStatuses } from "feature/logs/types/logs.type";
import {
  collection,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";



export const firebaseAddSongsLog = async (
  uid: string,
  data: string,
  songTitle: string,
  songArtist: string,
  status: FirebaseLogsSongsStatuses,
  difficulty_rate?: number | undefined
) => {
  const logsDocRef = doc(collection(db, "logs"));
  const userDocRef = doc(db, "users", uid);
  const userSnapshot = await getDoc(userDocRef);
  const userName = userSnapshot.data()!.displayName;

  const logData = {
    data,
    uid,
    userName,
    songTitle,
    songArtist,
    status,
  };

  await setDoc(logsDocRef, logData);

  try {
    const discordMessage = await formatDiscordMessage({
      ...logData,
      difficulty_rate,
    });
    await sendDiscordMessage(discordMessage as any);
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
};
