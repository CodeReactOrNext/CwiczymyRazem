import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "utils/firebase/client/firebase.types";
import { convertMsToHM } from "utils/converter";

const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data()?.displayName || userId;
    }
    return userId;
  } catch (error) {
    return userId;
  }
};

const formatLearnedMessage = async (log: FirebaseLogsSongsInterface) => {
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
};

const formatWantToLearnMessage = async (log: FirebaseLogsSongsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  return {
    embeds: [
      {
        title: "Chęć Nauki Utworu",
        description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** chce nauczyć się utworu **${log.songArtist} ${log.songTitle}**`,
        color: 0xf1c40f,
      },
    ],
  };
};

const formatLearningMessage = async (log: FirebaseLogsSongsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  return {
    embeds: [
      {
        title: "Uczenie się Utworu",
        description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** uczy się utworu **${log.songArtist} ${log.songTitle}**`,
        color: 0xe67e22,
      },
    ],
  };
};

const formatAddedMessage = async (log: FirebaseLogsSongsInterface) => {
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
};
const getStars = (rate: number) => {
  const fullStar = "⭐";
  const emptyStar = "☆";
  return `${fullStar.repeat(rate)}${emptyStar.repeat(10 - rate)}`;
};

const formatDifficultyRateMessage = async (log: FirebaseLogsSongsInterface) => {
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
};

const formatGeneralLogMessage = async (log: FirebaseLogsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  const fields = [];

  if (log.newLevel?.isNewLevel) {
    fields.push({
      name: "Nowy Poziom",
      value: String(log.newLevel.level),
      inline: false,
    });
  }

  if (log.newAchievements?.length) {
    fields.push({
      name: `${log.newAchievements?.length} Nowe Osiągnięcia!`,
      inline: false,
    });
  }

  if (log.timeSumary.creativityTime) {
    fields.push({
      name: "Czas na kreatywność",
      value: convertMsToHM(log.timeSumary.creativityTime),
      inline: false,
    });
  }

  if (log.timeSumary.hearingTime) {
    fields.push({
      name: "Czas na słuch",
      value: convertMsToHM(log.timeSumary.hearingTime),
      inline: false,
    });
  }

  if (log.timeSumary.techniqueTime) {
    fields.push({
      name: "Czas na technikę",
      value: convertMsToHM(log.timeSumary.techniqueTime),
      inline: false,
    });
  }

  if (log.timeSumary.theoryTime) {
    fields.push({
      name: "Czas na teorię",
      value: convertMsToHM(log.timeSumary.theoryTime),
      inline: false,
    });
  }

  return {
    embeds: [
      {
        title: "Nowy Raport",
        description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** zdobył **${log.points}** punktów!`,
        color: 0x3498db,
        fields,
      },
    ],
  };
};

export const formatDiscordMessage = async (
  log: FirebaseLogsInterface | FirebaseLogsSongsInterface
) => {
  if ("songTitle" in log) {
    switch (log.status) {
      case "learned":
        return formatLearnedMessage(log);
      case "wantToLearn":
        return formatWantToLearnMessage(log);
      case "learning":
        return formatLearningMessage(log);
      case "added":
        return formatAddedMessage(log);
      case "difficulty_rate":
        return formatDifficultyRateMessage(log);
      default:
        throw new Error("Unknown log status");
    }
  } else {
    return formatGeneralLogMessage(log);
  }
};
