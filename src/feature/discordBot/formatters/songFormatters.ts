import type { SongFormatter } from "feature/discordBot/types/formatter.types";
import type { FirebaseLogsSongsInterface } from "feature/logs/types/logs.type";

import { getUserDisplayName } from "../utils/userUtils";

const getStars = (rate: number) => {
  const fullStar = "⭐";
  const emptyStar = "☆";
  return `${fullStar.repeat(rate)}${emptyStar.repeat(10 - rate)}`;
};

export class LearnedSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface) {
    const displayName = await getUserDisplayName(log.uid);
    return {
      embeds: [
        {
          title: "Utwór Opanowany",
          description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** nauczył się utworu **${log.songArtist} ${log.songTitle}**`,
          color: 0x2ecc71,
        },
      ],
    };
  }
}

export class WantToLearnSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface) {
    const displayName = await getUserDisplayName(log.uid);
    return {
      embeds: [
        {
          title: "Nauka Utworu",
          description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** chce nauczyć się utworu **${log.songArtist} ${log.songTitle}**`,
          color: 0xf1c40f,
        },
      ],
    };
  }
}

export class LearningSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface) {
    const displayName = await getUserDisplayName(log.uid);
    return {
      embeds: [
        {
          title: "Nauka Utworu",
          description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** uczy się utworu **${log.songArtist} ${log.songTitle}**`,
          color: 0xe67e22,
        },
      ],
    };
  }
}

export class AddedSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface) {
    const displayName = await getUserDisplayName(log.uid);
    return {
      embeds: [
        {
          title: "Nowy Utwór Dodany",
          description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** dodał utwór **${log.songArtist} ${log.songTitle}**`,
          color: 0x3498db,
        },
      ],
    };
  }
}

export class DifficultyRateSongFormatter implements SongFormatter {
  async format(log: FirebaseLogsSongsInterface) {
    const displayName = await getUserDisplayName(log.uid);
    return {
      embeds: [
        {
          title: "Ocena Trudności Utworu",
          description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** ocenił trudność utworu **${log.songArtist} ${log.songTitle}**`,
          color: 0x9b59b6,
          fields: [
            {
              name: "Ocena ",
              value: `${getStars(log.difficulty_rate ?? 0)} (${
                log.difficulty_rate
              }/10)`,
              inline: false,
            },
          ],
        },
      ],
    };
  }
}
