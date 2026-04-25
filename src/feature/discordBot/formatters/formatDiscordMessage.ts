

import type { FirebaseLogsInterface, FirebaseLogsRecordingsInterface,FirebaseLogsSongsInterface } from "feature/logs/types/logs.type";

import type { SongFormatter } from "../types/formatter.types";
import { ActivityLogFormatter } from "./generalLogFormatter";
import { RecordingAddedFormatter } from "./recordingFormatters";
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
  log: FirebaseLogsInterface | FirebaseLogsSongsInterface | FirebaseLogsRecordingsInterface,
  lang: "PL" | "EN" = "PL"
) => {
  if ("type" in log && log.type === "recording_added") {
    const formatter = new RecordingAddedFormatter();
    return formatter.format(log as FirebaseLogsRecordingsInterface, lang);
  }

  if ("status" in log) {
    const formatter = getSongFormatter(log.status);
    return formatter.format(log as FirebaseLogsSongsInterface, lang);
  } else {
    const formatter = new ActivityLogFormatter();
    return formatter.format(log as FirebaseLogsInterface, lang);
  }
};

