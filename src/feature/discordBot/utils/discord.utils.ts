import {logger } from "feature/logger/Logger";

import type { DiscordMessage } from "../types/discord.types";

export const sendDiscordMessage = async (
  message: DiscordMessage
): Promise<boolean> => {
  const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.error("Discord webhook URL not configured", { context: "sendDiscordMessage" });
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    logger.error(error, { context: "sendDiscordMessage" });
    return false;
  }
};
