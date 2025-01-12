import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "utils/firebase/client/firebase.types";

const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data()?.displayName || userId;
    }
    return userId;
  } catch (error) {
    return userId;
  }
};

export const formatDiscordMessage = async (
  log: FirebaseLogsInterface | FirebaseLogsSongsInterface
) => {
  const displayName = await getUserDisplayName(log.uid);
  const timestamp = new Date().toLocaleString("pl-PL");

  if ("songTitle" in log) {
    // Song log
    return {
      content: `🎵 **Zmiana Statusu Utworu** 🎵
━━━━━━━━━━━━━━━━━━━━
👤 **Użytkownik:** ${displayName}
🎶 **Utwór:** ${log.songTitle}
🎤 **Artysta:** ${log.songArtist}
📈 **Status:** ${log.status}
🕒 **Data:** ${timestamp}
━━━━━━━━━━━━━━━━━━━━`,
      username: "CwiczymyRazem Bot",
      avatar_url: "https://cwiczymyrazem.pl/logo.png",
    };
  } else {
    return {
      content: `🎯 **Nowy Raport** 🎯
━━━━━━━━━━━━━━━━━━━━
👤 **Użytkownik:** ${displayName}
⭐ **Punkty:** ${log.points || 0}
${log.newLevel?.isNewLevel ? `🏆 **Nowy Poziom:** ${log.newLevel.level}` : ""}
${
  log.newAchievements?.length > 0
    ? `🎖️ **Nowe Osiągnięcia:** ${log.newAchievements.join(", ")}`
    : ""
}
🕒 **Data:** ${timestamp}
━━━━━━━━━━━━━━━━━━━━`,
      username: "CwiczymyRazem Bot",
      avatar_url: "https://cwiczymyrazem.pl/logo.png",
    };
  }
};
