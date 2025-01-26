import { DiscordMessage } from "../types/discord.types";

export const sendDiscordMessage = async (
  message: DiscordMessage
): Promise<boolean> => {
  const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("Discord webhook URL not configured");
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
    console.error("Error sending Discord message:", error);
    return false;
  }
};
