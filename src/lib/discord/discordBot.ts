/**
 * The Riff Quest bot, over Discord's REST API.
 *
 * The rest of the app's Discord traffic is one-way webhooks; the bot is for the
 * things a webhook can't do — opening threads, posting into them, deleting its
 * own messages — and for channels that don't have a webhook. Only REST, never
 * the gateway, so the same token can be shared with a bot doing other work.
 *
 * Server-only. Needs DISCORD_BOT_TOKEN; without it every call answers null and
 * the features built on it carry on without Discord.
 */
const API = "https://discord.com/api/v10";

export const DISCORD_SITE = "https://riff.quest";
export const DISCORD_AMBER = 0xf5b700;

const CHANNEL_TYPE_FORUM = 15;
const CHANNEL_TYPE_MEDIA = 16;
const LINK_BUTTON = 5;

let lastError: string | null = null;

/**
 * Why the most recent call failed — "403 Missing Access", "no response"… — so
 * a feature can store it where an admin will see it, instead of only in logs.
 */
export const lastDiscordError = (): string | null => lastError;

export const isDiscordBotConfigured = (): boolean =>
  !!process.env.DISCORD_BOT_TOKEN;

/** One REST call. Null when the bot isn't configured or Discord says no (logged). */
export const discordCall = async <T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T | null> => {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      lastError = `${method} ${path}: ${response.status} ${detail.slice(0, 200)}`;
      console.error(
        `discord ${method} ${path} failed`,
        response.status,
        detail,
      );
      return null;
    }
    return response.status === 204 ? null : ((await response.json()) as T);
  } catch (error) {
    lastError = `${method} ${path}: no response`;
    console.error(`discord ${method} ${path} failed`, error);
    return null;
  }
};

/** A row of link buttons under a message. */
export const linkButtons = (buttons: Array<{ label: string; url: string }>) => [
  {
    type: 1,
    components: buttons.map((button) => ({
      type: 2,
      style: LINK_BUTTON,
      ...button,
    })),
  },
];

/** Forum and media channels take posts (threads), not plain messages. Null when unreadable. */
export const isForumChannel = async (
  channelId: string,
): Promise<boolean | null> => {
  const channel = await discordCall<{ type: number }>(
    "GET",
    `/channels/${channelId}`,
  );
  if (!channel) return null;
  return (
    channel.type === CHANNEL_TYPE_FORUM || channel.type === CHANNEL_TYPE_MEDIA
  );
};

export const discordChannelUrl = (guildId: string, channelId: string) =>
  `https://discord.com/channels/${guildId}/${channelId}`;
