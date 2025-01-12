import { NextApiRequest, NextApiResponse } from "next";
import { onSnapshot, collection, doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { FirebaseLogsInterface } from "utils/firebase/client/firebase.types";
import { sendDiscordMessage } from "utils/firebase/client/discord.utils";

const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data()?.userInfo?.displayName || userId;
    }
    return userId;
  } catch (error) {
    return userId;
  }
};

interface ExtendedFirebaseLogsInterface
  extends Omit<FirebaseLogsInterface, "newLevel"> {
  userId: string;
  type: string;
  exerciseTime?: number;
  achievement?: string;
  newLevel?: { isNewLevel: boolean; level: number };
  songName?: string;
  newStatus?: string;
}

const getLogMessage = async (
  logData: ExtendedFirebaseLogsInterface
): Promise<string> => {
  const timestamp = new Date(logData.timestamp).toLocaleString("pl-PL");
  const displayName = await getUserDisplayName(logData.userId);

  switch (logData.type) {
    case "report":
      return `🎯 **Nowy Raport**
• Użytkownik: ${displayName}
• Czas ćwiczeń: ${logData.exerciseTime} minut
• Data: ${timestamp}`;

    case "achievement":
      return `🏆 **Nowe Osiągnięcie**
• Użytkownik: ${displayName}
• Osiągnięcie: ${logData.achievement}
• Data: ${timestamp}`;

    case "level_up":
      return `⭐ **Nowy Poziom**
• Użytkownik: ${displayName}
• Poziom: ${logData.newLevel}
• Data: ${timestamp}`;

    case "song_status":
      return `🎵 **Zmiana Statusu Utworu**
• Użytkownik: ${displayName}
• Utwór: ${logData.songName}
• Status: ${logData.newStatus}
• Data: ${timestamp}`;

    default:
      return `📝 **Nowy Log**
• Użytkownik: ${displayName}
• Typ: ${logData.type}
• Data: ${timestamp}`;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const logsRef = collection(db, "logs");

    const unsubscribe = onSnapshot(logsRef, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          const logData = change.doc.data() as ExtendedFirebaseLogsInterface;

          const message = {
            content: await getLogMessage(logData),
            username: "CwiczymyRazem Bot",
            avatar_url: "https://cwiczymyrazem.pl/logo.png",
          };

          await sendDiscordMessage(message);
        }
      }
    });

    // Clean up listener after 1 hour
    setTimeout(() => {
      unsubscribe();
    }, 3600000);

    res.status(200).json({ message: "Webhook started" });
  } catch (error) {
    console.error("Error in logs webhook:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
