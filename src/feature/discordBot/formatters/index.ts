import {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "utils/firebase/client/firebase.types";
import { SongFormatter } from "../types/formatter.types";
import {
  LearnedSongFormatter,
  WantToLearnSongFormatter,
  LearningSongFormatter,
  AddedSongFormatter,
  DifficultyRateSongFormatter,
} from "./songFormatters";
import { ActivityLogFormatter } from "./generalLogFormatter";

export const formatDiscordMessage = async (
  log: FirebaseLogsInterface | FirebaseLogsSongsInterface
) => {
  if ("songTitle" in log) {
    const formatter = getSongFormatter(log.status);
    return formatter.format(log);
  } else {
    const formatter = new ActivityLogFormatter();
    return formatter.format(log);
  }
};

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
