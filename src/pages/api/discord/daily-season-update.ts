import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { sendDiscordMessage } from "utils/firebase/client/discord.utils";
import { db } from "utils/firebase/client/firebase.utils";

async function getTopSeasonalPlayers(seasonId: string, limit: number = 5) {
  const seasonalUsersRef = collection(db, "seasons", seasonId, "users");
  const q = query(seasonalUsersRef, orderBy("points", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    displayName: doc.data().displayName,
    points: doc.data().points,
  }));
}

async function getSeasonEndDate(seasonId: string): Promise<Date | null> {
  const seasonDocRef = doc(db, "seasons", seasonId);
  const seasonDoc = await getDoc(seasonDocRef);

  if (!seasonDoc.exists()) {
    return null;
  }

  const endDate = seasonDoc.data().endDate;
  return new Date(endDate);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const now = new Date();
    const seasonId = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const topPlayers = await getTopSeasonalPlayers(seasonId);
    const endDate = await getSeasonEndDate(seasonId);

    if (!endDate) {
      return res.status(404).json({ message: "Season not found" });
    }

    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (topPlayers.length === 0) {
      return res.status(200).json({ message: "No players found" });
    }
    const leaderboardMessage = {
      embeds: [
        {
          title: "🏆 **Aktualni Liderzy Sezonu**",
          description: "Sprawdź, kto prowadzi w tym sezonie! 🔥",
          color: 0xf1c40f,
          fields: topPlayers.map((player, index) => ({
            name: `${index + 1}. ${["🥇", "🥈", "🥉"][index] || "🎖️"} **${player.displayName}**`,
            value: `Punkty: **${player.points}**`,
            inline: false, 
          })),
          footer: {
            text: `Do końca sezonu zostało ${daysLeft} dni.`,
          },
          thumbnail: {
            url: "https://www.cwiczymy-razem.pl/discord/leadboard.png",
          },
        },
        {
          title: "➡️ **Dołącz do zabawy!**",
          description: " https://www.cwiczymy-razem.pl",
          color: 0x3498db,
        },
      ],
    };

    await sendDiscordMessage(leaderboardMessage as any);
    res.status(200).json({ message: "Daily update sent" });
  } catch (error) {
    console.error("Error sending daily update:", error);
    res.status(500).json({ message: "Error sending daily update" });
  }
}
