import { NextApiRequest, NextApiResponse } from "next";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { sendDiscordMessage } from "utils/firebase/client/discord.utils";

async function getTopSeasonalPlayers(seasonId: string, limit: number = 5) {
  const seasonalUsersRef = collection(db, "seasons", seasonId, "users");
  const q = query(seasonalUsersRef, orderBy("points", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    displayName: doc.data().displayName,
    points: doc.data().points,
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const now = new Date();
    const seasonId = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const topPlayers = await getTopSeasonalPlayers(seasonId);

    if (topPlayers.length === 0) {
      return res.status(200).json({ message: "No players found" });
    }

    const leaderboardMessage = {
      embeds: [
        {
          title: "🏆 Aktualni Liderzy Sezonu",
          description: topPlayers
            .slice(0, 5)
            .map(
              (player, index) =>
                `${index + 1}. **${player.displayName}** - ${
                  player.points
                } punktów`
            )
            .join("\n"),
          color: 0xf1c40f,
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
