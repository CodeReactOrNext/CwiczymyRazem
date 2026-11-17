import type {
  ImprovRound,
  ImprovTake,
} from "feature/improv/types/improv.types";
import {
  IMPROV_PROVIDER_LABEL,
  takeThumbnail,
} from "feature/improv/utils/improvLink";
import { improvDateRange } from "feature/improv/utils/improvRound";
import {
  DISCORD_AMBER,
  DISCORD_SITE,
  discordCall,
  discordChannelUrl,
  isDiscordBotConfigured,
  isForumChannel,
  linkButtons,
} from "lib/discord/discordBot";

/**
 * The improv side of the bot (see lib/discord/discordBot): a thread per round,
 * and a message in it for every take.
 *
 * Needs DISCORD_BOT_TOKEN and DISCORD_IMPROV_CHANNEL_ID — the channel the
 * rounds live in: a forum channel (one post per round) or a text channel (one
 * thread per round, started from the bot's announcement). Without them every
 * function here answers null and the module simply runs without Discord.
 * The bot needs: View Channel, Send Messages, Send Messages in Threads, Create
 * Public Threads, Embed Links.
 */
/** A thread goes quiet after a week; posting in it wakes it up again. */
const AUTO_ARCHIVE_MINUTES = 10080;

const improvChannelId = (): string | null =>
  isDiscordBotConfigured()
    ? (process.env.DISCORD_IMPROV_CHANNEL_ID ?? null)
    : null;

export const isImprovDiscordConfigured = (): boolean =>
  improvChannelId() !== null;

export interface ImprovThread {
  threadId: string;
  guildId: string;
}

export const improvThreadUrl = ({ guildId, threadId }: ImprovThread): string =>
  discordChannelUrl(guildId, threadId);

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
        url: `${DISCORD_SITE}/improv`,
        color: DISCORD_AMBER,
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
      { label: "Link your take", url: `${DISCORD_SITE}/improv?submit=1` },
    ]),
    allowed_mentions: { parse: [] },
  };
};

type ThreadResponse = { id: string; guild_id: string };

const toThread = (thread: ThreadResponse | null): ImprovThread | null =>
  thread ? { threadId: thread.id, guildId: thread.guild_id } : null;

/** Opens the round's thread with the announcement in it. Null when Discord is off or refuses. */
export const openImprovThread = async (
  round: ImprovRound,
): Promise<ImprovThread | null> => {
  const channelId = improvChannelId();
  if (!channelId) return null;

  const isForum = await isForumChannel(channelId);
  if (isForum === null) return null;

  if (isForum) {
    return toThread(
      await discordCall<ThreadResponse>(
        "POST",
        `/channels/${channelId}/threads`,
        {
          name: threadName(round),
          auto_archive_duration: AUTO_ARCHIVE_MINUTES,
          message: announcement(round),
        },
      ),
    );
  }

  const message = await discordCall<{ id: string }>(
    "POST",
    `/channels/${channelId}/messages`,
    announcement(round),
  );
  if (!message) return null;

  return toThread(
    await discordCall<ThreadResponse>(
      "POST",
      `/channels/${channelId}/messages/${message.id}/threads`,
      { name: threadName(round), auto_archive_duration: AUTO_ARCHIVE_MINUTES },
    ),
  );
};

/** Posts one take into the round's thread. Returns the message id, or null. */
export const postImprovTake = async (
  thread: ImprovThread,
  round: ImprovRound,
  take: ImprovTake,
): Promise<string | null> => {
  if (!isImprovDiscordConfigured()) return null;

  const thumbnail = takeThumbnail(take.url);
  const message = await discordCall<{ id: string }>(
    "POST",
    `/channels/${thread.threadId}/messages`,
    {
      content: `New take from **${take.userName}** 🎸`,
      embeds: [
        {
          author: {
            name: `${take.userName} · Take ${take.takeNumber}`,
            url: `${DISCORD_SITE}/user/${take.userId}`,
            ...(take.userAvatar ? { icon_url: take.userAvatar } : {}),
          },
          ...(take.note ? { description: `“${take.note}”` } : {}),
          url: take.url,
          color: DISCORD_AMBER,
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
        { label: "All takes on Riff Quest", url: `${DISCORD_SITE}/improv` },
      ]),
      // A display name is the player's own text — it must never ping anyone.
      allowed_mentions: { parse: [] },
    },
  );
  return message?.id ?? null;
};

export const deleteImprovTakeMessage = async (
  threadId: string,
  messageId: string,
): Promise<void> => {
  if (!isImprovDiscordConfigured()) return;
  await discordCall("DELETE", `/channels/${threadId}/messages/${messageId}`);
};
