import type { SongFormatter } from "feature/discordBot/types/formatter.types";
import type { FirebaseLogsSongsInterface } from "feature/logs/types/logs.type";

import { getUserDisplayName } from "../utils/userUtils";

const getStars = (rate: number) => {
  const fullStar = "⭐";
  const emptyStar = "☆";
  return `${fullStar.repeat(rate)}${emptyStar.repeat(10 - rate)}`;
};

export class LearnedSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface, lang: "PL" | "EN" = "PL") {
    const displayName = await getUserDisplayName(log.uid);
    const isEn = lang === "EN";
    return {
      embeds: [
        {
          title: isEn ? "🎉 Song Mastered!" : "🎉 Utwór Opanowany!",
          description: isEn
            ? `**${displayName}** has mastered the art of playing **${log.songArtist} - ${log.songTitle}**! 🎸`
            : `**${displayName}** opanował grę **${log.songArtist} - ${log.songTitle}**! 🎸`,
          color: 0x2ecc71, // Green
          ...(isEn && {
            thumbnail: {
              url: log.avatarUrl || "https://riff.quest/images/default-avatar.png",
            },
          }),
          footer: {
            text: isEn ? "Legend in the making!" : "Legenda rośnie w siłę!",
          },
        },
      ],
    };
  }
}

export class WantToLearnSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface, lang: "PL" | "EN" = "PL") {
    const displayName = await getUserDisplayName(log.uid);
    const isEn = lang === "EN";
    return {
      embeds: [
        {
          title: isEn ? "✨ New Goal Set!" : "✨ Nowy Cel!",
          description: isEn
            ? `**${displayName}** wants to learn **${log.songArtist} - ${log.songTitle}**.`
            : `**${displayName}** chce nauczyć się utworu **${log.songArtist} - ${log.songTitle}**.`,
          color: 0xf1c40f, // Yellow
          ...(isEn && {
            thumbnail: {
              url: log.avatarUrl || "https://riff.quest/images/default-avatar.png",
            },
          }),
          footer: {
            text: isEn ? "Good luck!" : "Powodzenia!",
          },
        },
      ],
    };
  }
}

export class LearningSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface, lang: "PL" | "EN" = "PL") {
    const displayName = await getUserDisplayName(log.uid);
    const isEn = lang === "EN";
    return {
      embeds: [
        {
          title: isEn ? "🔥 Practice in Progress" : "🔥 Nauka w Toku",
          description: isEn
            ? `**${displayName}** is currently hard at work learning **${log.songArtist} - ${log.songTitle}**.`
            : `**${displayName}** ciężko pracuje nad utworem **${log.songArtist} - ${log.songTitle}**.`,
          color: 0xe67e22, // Orange
          ...(isEn && {
            thumbnail: {
              url: log.avatarUrl || "https://riff.quest/images/default-avatar.png",
            },
          }),
          footer: {
            text: isEn ? "Keep pushing!" : "Dajesz czadu!",
          },
        },
      ],
    };
  }
}

export class AddedSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface, lang: "PL" | "EN" = "PL") {
    const displayName = await getUserDisplayName(log.uid);
    const isEn = lang === "EN";
    return {
      embeds: [
        {
          title: isEn ? "🆕 New Song Discovered" : "🆕 Nowy Utwór Dodany",
          description: isEn
            ? `**${displayName}** added **${log.songArtist} - ${log.songTitle}** to their collection.`
            : `**${displayName}** dodał **${log.songArtist} - ${log.songTitle}** do swojej kolekcji.`,
          color: 0x3498db, // Blue
          ...(isEn && {
            thumbnail: {
              url: log.avatarUrl || "https://riff.quest/images/default-avatar.png",
            },
          }),
        },
      ],
    };
  }
}

export class DifficultyRateSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface, lang: "PL" | "EN" = "PL") {
    const displayName = await getUserDisplayName(log.uid);
    const isEn = lang === "EN";
    return {
      embeds: [
        {
          title: isEn ? "📊 Difficulty Rated" : "📊 Ocena Trudności",
          description: isEn
            ? `**${displayName}** rated the difficulty of **${log.songArtist} - ${log.songTitle}**`
            : `**${displayName}** ocenił trudność utworu **${log.songArtist} - ${log.songTitle}**`,
          color: 0x9b59b6, // Purple
          ...(isEn && {
            thumbnail: {
              url: log.avatarUrl || "https://riff.quest/images/default-avatar.png",
            },
          }),
          fields: [
            {
              name: isEn ? "Rating" : "Ocena",
              value: `${getStars(log.difficulty_rate ?? 0)} (${log.difficulty_rate
                }/10)`,
              inline: false,
            },
          ],
        },
      ],
    };
  }
}
