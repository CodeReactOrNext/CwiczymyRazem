import { sendDiscordMessage } from "feature/discordBot/utils/discord.utils";
import { SeasonService } from "feature/discordBot/services/seasonService";
import { SeasonUpdateFormatter } from "feature/discordBot/formatters/seasonFormatter";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const seasonService = new SeasonService();
    const seasonData = await seasonService.getSeasonData();

    if (!seasonData) {
      return res.status(404).json({ message: "Season data not found" });
    }

    const formatter = new SeasonUpdateFormatter();
    const message = formatter.format(seasonData);

    await sendDiscordMessage(message);
    res.status(200).json({ message: "Daily update sent" });
  } catch (error) {
    console.error("Error sending daily update:", error);
    res.status(500).json({ message: "Error sending daily update" });
  }
}
