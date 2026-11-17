import type {
  ImprovRound,
  ImprovTake,
} from "feature/improv/types/improv.types";
import {
  IMPROV_PROVIDER_LABEL,
  takeThumbnail,
} from "feature/improv/utils/improvLink";
import { improvDateRange } from "feature/improv/utils/improvRound";

/**
 * The improv bot. Unlike the rest of the app's Discord traffic (one-way
 * webhooks), a round needs a thread of its own and messages posted into it, so
 * this talks to the REST API as a bot user.
 *
 * Needs two server-side variables — without them every function here answers
 * null and the module simply runs without Discord:
 *  - DISCORD_BOT_TOKEN          the bot's token
 *  - DISCORD_IMPROV_CHANNEL_ID  the channel the rounds live in: a forum channel
 *                               (one post per round) or a text channel (one
 *                               thread per round, started from the bot's
 *                               announcement). Both work.
 * The bot needs: View Channel, Send Messages, Send Messages in Threads, Create
 * Public Threads, Embed Links.
 */
const API = "https://discord.com/api/v10";
const SITE = "https://riff.quest";
const AMBER = 0xf5b700;
/** A thread goes quiet after a week; posting in it wakes it up again. */
const AUTO_ARCHIVE_MINUTES = 10080;
const CHANNEL_TYPE_FORUM = 15;
const CHANNEL_TYPE_MEDIA = 16;

const LINK_BUTTON = 5;

interface DiscordConfig {
  token: string;
  channelId: string;
}

const readConfig = (): DiscordConfig | null => {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_IMPROV_CHANNEL_ID;
  return token && channelId ? { token, channelId } : null;
};

export const isImprovDiscordConfigured = (): boolean => readConfig() !== null;

export interface ImprovThread {
  threadId: string;
  guildId: string;
}

export const improvThreadUrl = ({ guildId, threadId }: ImprovThread): string =>
  `https://discord.com/channels/${guildId}/${threadId}`;

const call = async <T>(
  config: DiscordConfig,
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T | null> => {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${config.token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    console.error(
      `improv discord ${method} ${path} failed`,
      response.status,
      await response.text().catch(() => ""),
    );
    return null;
  }
  return response.status === 204 ? null : ((await response.json()) as T);
};

const linkButtons = (buttons: Array<{ label: string; url: string }>) => [
  {
    type: 1,
    components: buttons.map((button) => ({
      type: 2,
      style: LINK_BUTTON,
      ...button,
    })),
  },
];

const threadName = (round: ImprovRound): string =>
  `Improv #${round.number} · ${improvDateRange(round.startsAt, round.endsAt)} · ${round.title}`.slice(
    0,
    100,
  );

const announcement = (round: ImprovRound) => {
  const ends = Math.floor(round.endsAt / 1000);
  return {
    content: `**Improv round #${round.number} is live!** It runs until <t:${ends}:F>. Play along, film a take, link it on Riff Quest and I'll post it here. Positive feedback only. 🤘
https://www.youtube.com/watch?v=${round.youtubeId}`,
    embeds: [
      {
        title: round.title,
        url: `${SITE}/improv`,
        color: AMBER,
        fields: [
          ...(round.channel
            ? [{ name: "Track", value: round.channel, inline: true }]
            : []),
          { name: "Ends", value: `<t:${ends}:R>`, inline: true },
        ],
        footer: {
          text: `riff.quest · backing track picked by ${round.uploadedByName}`,
        },
      },
    ],
    components: linkButtons([
      {
        label: "Play the backing track",
        url: `https://www.youtube.com/watch?v=${round.youtubeId}`,
      },
      { label: "Link your take", url: `${SITE}/improv?submit=1` },
    ]),
    allowed_mentions: { parse: [] },
  };
};

/** Opens the round's thread with the announcement in it. Null when Discord is off or refuses. */
export const openImprovThread = async (
  round: ImprovRound,
): Promise<ImprovThread | null> => {
  const config = readConfig();
  if (!config) return null;

  try {
    const channel = await call<{ type: number }>(
      config,
      "GET",
      `/channels/${config.channelId}`,
    );
    if (!channel) return null;

    const isForum =
      channel.type === CHANNEL_TYPE_FORUM ||
      channel.type === CHANNEL_TYPE_MEDIA;

    if (isForum) {
      const thread = await call<{ id: string; guild_id: string }>(
        config,
        "POST",
        `/channels/${config.channelId}/threads`,
        {
          name: threadName(round),
          auto_archive_duration: AUTO_ARCHIVE_MINUTES,
          message: announcement(round),
        },
      );
      return thread ? { threadId: thread.id, guildId: thread.guild_id } : null;
    }

    const message = await call<{ id: string }>(
      config,
      "POST",
      `/channels/${config.channelId}/messages`,
      announcement(round),
    );
    if (!message) return null;

    const thread = await call<{ id: string; guild_id: string }>(
      config,
      "POST",
      `/channels/${config.channelId}/messages/${message.id}/threads`,
      { name: threadName(round), auto_archive_duration: AUTO_ARCHIVE_MINUTES },
    );
    return thread ? { threadId: thread.id, guildId: thread.guild_id } : null;
  } catch (error) {
    console.error("improv discord: opening the thread failed", error);
    return null;
  }
};

/** Posts one take into the round's thread. Returns the message id, or null. */
export const postImprovTake = async (
  thread: ImprovThread,
  round: ImprovRound,
  take: ImprovTake,
): Promise<string | null> => {
  const config = readConfig();
  if (!config) return null;

  const thumbnail = takeThumbnail(take.url);
  try {
    const message = await call<{ id: string }>(
      config,
      "POST",
      `/channels/${thread.threadId}/messages`,
      {
        content: `New take from **${take.userName}** 🎸`,
        embeds: [
          {
            author: {
              name: `${take.userName} · Take ${take.takeNumber}`,
              url: `${SITE}/user/${take.userId}`,
              ...(take.userAvatar ? { icon_url: take.userAvatar } : {}),
            },
            ...(take.note ? { description: `“${take.note}”` } : {}),
            url: take.url,
            color: AMBER,
            ...(thumbnail ? { image: { url: thumbnail } } : {}),
            footer: {
              text: `Riff Quest · Improv #${round.number} · ${IMPROV_PROVIDER_LABEL[take.provider]}`,
            },
          },
        ],
        components: linkButtons([
          {
            label: `Watch on ${IMPROV_PROVIDER_LABEL[take.provider]}`,
            url: take.url,
          },
          { label: "All takes on Riff Quest", url: `${SITE}/improv` },
        ]),
        // A display name is the player's own text — it must never ping anyone.
        allowed_mentions: { parse: [] },
      },
    );
    return message?.id ?? null;
  } catch (error) {
    console.error("improv discord: posting a take failed", error);
    return null;
  }
};

export const deleteImprovTakeMessage = async (
  threadId: string,
  messageId: string,
): Promise<void> => {
  const config = readConfig();
  if (!config) return;
  try {
    await call(config, "DELETE", `/channels/${threadId}/messages/${messageId}`);
  } catch (error) {
    console.error("improv discord: deleting a take message failed", error);
  }
};
