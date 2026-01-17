

import type { FirebaseLogsInterface, FirebaseLogsSongsInterface } from "feature/logs/types/logs.type";

import type { SongFormatter } from "../types/formatter.types";
import { ActivityLogFormatter } from "./generalLogFormatter";
import {
  AddedSongFormatter,
  DifficultyRateSongFormatter,
  LearnedSongFormatter,
  LearningSongFormatter,
  WantToLearnSongFormatter,
} from "./songFormatters";


const getSongFormatter = (status: string): SongFormatter => {
  switch (status) {
    case "learned":
      return new LearnedSongFormatter();
    case "wantToLearn":
      return new WantToLearnSongFormatter();
    case "learning":
      return new LearningSongFormatter();
    case "added":
      return new AddedSongFormatter();
    case "difficulty_rate":
      return new DifficultyRateSongFormatter();
    default:
      throw new Error("Unknown log status");
  }
};

export const formatDiscordMessage = async (
  log: FirebaseLogsInterface | FirebaseLogsSongsInterface,
  lang: "PL" | "EN" = "PL"
) => {
  if ("status" in log) {
    const formatter = getSongFormatter(log.status);
    return formatter.format(log, lang);
  } else {
    const formatter = new ActivityLogFormatter();
    return formatter.format(log, lang);
  }
};

