import type { ChallengeSong } from "feature/challenges/types/challenge.types";
import { challengeMonthLabel } from "feature/challenges/utils/challengeMonth";
import {
  IMPROV_PROVIDER_LABEL,
  parseTakeLink,
} from "feature/improv/utils/improvLink";
import {
  DISCORD_AMBER,
  DISCORD_SITE,
  discordCall,
  isDiscordBotConfigured,
  isForumChannel,
  linkButtons,
} from "lib/discord/discordBot";

/**
 * Where the bot posts monthly-challenge recordings. The owner's channel by
 * default; DISCORD_CHALLENGES_CHANNEL_ID overrides it (e.g. a test server).
 */
const DEFAULT_CHALLENGES_CHANNEL_ID = "1526652053835747338";

const challengesChannelId = (): string =>
  process.env.DISCORD_CHALLENGES_CHANNEL_ID || DEFAULT_CHALLENGES_CHANNEL_ID;

export const isChallengeDiscordConfigured = (): boolean =>
  isDiscordBotConfigured();

export interface ChallengeRunPost {
  challengeId: string;
  isLive: boolean;
  song: ChallengeSong;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  videoUrl: string;
  title: string;
}

/** Where the message landed: the forum post's thread, or the text channel. */
export interface PostedChallengeRun {
  channelId: string;
  messageId: string;
}

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

const runMessage = (run: ChallengeRunPost) => {
  // The submission is written by the player's browser, so its link is only
  // trusted when it points at a video host we know; anything else becomes a
  // link to the board instead of being republished by the bot.
  const video = parseTakeLink(run.videoUrl);
  const watchUrl = video?.url ?? `${DISCORD_SITE}/challenges`;
  const songLine = `${run.song.title} — ${run.song.artist}`;
  const month = challengeMonthLabel(run.challengeId);
  const avatar = run.userAvatarUrl?.startsWith("https://")
    ? run.userAvatarUrl
    : null;

  return {
    content: `New challenge run from **${clip(run.userName, 80)}** 🎸`,
    embeds: [
      {
        author: {
          name: clip(run.userName, 100),
          url: `${DISCORD_SITE}/user/${run.userId}`,
          ...(avatar ? { icon_url: avatar } : {}),
        },
        title: clip(songLine, 256),
        url: watchUrl,
        ...(run.title && run.title !== run.song.title
          ? { description: `“${clip(run.title, 300)}”` }
          : {}),
        color: DISCORD_AMBER,
        ...(video?.youtubeId
          ? {
              image: {
                url: `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
              },
            }
          : {}),
        footer: {
          text: `Riff Quest · ${month} challenge${run.isLive ? "" : " · archive run"}`,
        },
      },
    ],
    components: linkButtons([
      {
        label: video
          ? `Watch on ${IMPROV_PROVIDER_LABEL[video.provider]}`
          : "Watch on Riff Quest",
        url: watchUrl,
      },
      { label: "Monthly challenges", url: `${DISCORD_SITE}/challenges` },
    ]),
    // Display names are the player's own text — they must never ping anyone.
    allowed_mentions: { parse: [] },
  };
};

/**
 * Posts one run. A forum channel gets a post per run (its replies are the
 * feedback); a text channel gets a plain message. Null when Discord is off or
 * refuses.
 */
export const postChallengeRun = async (
  run: ChallengeRunPost,
): Promise<PostedChallengeRun | null> => {
  if (!isChallengeDiscordConfigured()) return null;
  const channelId = challengesChannelId();

  const isForum = await isForumChannel(channelId);
  if (isForum === null) return null;

  if (isForum) {
    const thread = await discordCall<{ id: string }>(
      "POST",
      `/channels/${channelId}/threads`,
      {
        name: clip(`${run.song.title} · ${run.userName}`, 100),
        message: runMessage(run),
      },
    );
    // A forum post's first message shares the thread's id.
    return thread ? { channelId: thread.id, messageId: thread.id } : null;
  }

  const message = await discordCall<{ id: string }>(
    "POST",
    `/channels/${channelId}/messages`,
    runMessage(run),
  );
  return message ? { channelId, messageId: message.id } : null;
};
