import type {
  FirebaseLogsCaseOpenInterface,
  FirebaseLogsDailyQuestInterface,
  FirebaseLogsInterface,
  FirebaseLogsMarketplaceInterface,
  FirebaseLogsPlaylistInterface,
  FirebaseLogsRecordingsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsTopPlayersInterface,
} from "feature/logs/types/logs.type";

export type AnyFirebaseLog =
  | FirebaseLogsSongsInterface
  | FirebaseLogsInterface
  | FirebaseLogsTopPlayersInterface
  | FirebaseLogsRecordingsInterface
  | FirebaseLogsDailyQuestInterface
  | FirebaseLogsCaseOpenInterface
  | FirebaseLogsMarketplaceInterface
  | FirebaseLogsPlaylistInterface;

export const isFirebaseLogsSongs = (
  log: AnyFirebaseLog
): log is FirebaseLogsSongsInterface => {
  return (log as FirebaseLogsSongsInterface).status !== undefined;
};

export const isFirebaseLogsTopPlayers = (
  log: AnyFirebaseLog
): log is FirebaseLogsTopPlayersInterface => {
  return (log as FirebaseLogsTopPlayersInterface).type === "top_players_update";
};

export const isFirebaseLogsRecording = (
  log: AnyFirebaseLog
): log is FirebaseLogsRecordingsInterface => {
  return (log as FirebaseLogsRecordingsInterface).type === "recording_added";
};

export const isFirebaseLogsDailyQuest = (
  log: AnyFirebaseLog
): log is FirebaseLogsDailyQuestInterface => {
  return (log as FirebaseLogsDailyQuestInterface).type === "daily_quest_completed";
};

export const isFirebaseLogsCaseOpen = (
  log: AnyFirebaseLog
): log is FirebaseLogsCaseOpenInterface => {
  return (log as FirebaseLogsCaseOpenInterface).type === "case_open";
};

export const isFirebaseLogsMarketplace = (
  log: AnyFirebaseLog
): log is FirebaseLogsMarketplaceInterface => {
  return (log as FirebaseLogsMarketplaceInterface).type === "marketplace_listing";
};

export const isFirebaseLogsPlaylist = (
  log: AnyFirebaseLog
): log is FirebaseLogsPlaylistInterface => {
  return (log as FirebaseLogsPlaylistInterface).type === "playlist_created";
};

export type LogActivityType =
  | "song"
  | "recording"
  | "dailyQuest"
  | "caseOpen"
  | "marketplace"
  | "playlist"
  | "topPlayers"
  | "exercisePlan"
  | "exercise";

/** Classifies a log entry into a coarse activity type used for feed grouping and Fame rewards. */
export const getLogActivityType = (log: AnyFirebaseLog): LogActivityType => {
  if (isFirebaseLogsSongs(log)) return "song";
  if (isFirebaseLogsTopPlayers(log)) return "topPlayers";
  if (isFirebaseLogsRecording(log)) return "recording";
  if (isFirebaseLogsDailyQuest(log)) return "dailyQuest";
  if (isFirebaseLogsCaseOpen(log)) return "caseOpen";
  if (isFirebaseLogsMarketplace(log)) return "marketplace";
  if (isFirebaseLogsPlaylist(log)) return "playlist";
  return (log as FirebaseLogsInterface).planId ? "exercisePlan" : "exercise";
};

const getLogUid = (log: AnyFirebaseLog): string | undefined => (log as { uid?: string }).uid;

export interface LogGroup<T extends AnyFirebaseLog = AnyFirebaseLog> {
  type: LogActivityType;
  uid?: string;
  logs: T[];
}

/**
 * Groups consecutive logs of the same activity type performed by the same user into a single
 * visual group. A different activity type or a different user's log breaks the group — logs
 * that have no owning user (e.g. season top-players digests) are never grouped together.
 */
export const groupConsecutiveLogs = <T extends AnyFirebaseLog>(logs: T[]): LogGroup<T>[] => {
  const groups: LogGroup<T>[] = [];

  for (const log of logs) {
    const type = getLogActivityType(log);
    const uid = getLogUid(log);
    const previousGroup = groups[groups.length - 1];

    if (previousGroup && uid && previousGroup.type === type && previousGroup.uid === uid) {
      previousGroup.logs.push(log);
    } else {
      groups.push({ type, uid, logs: [log] });
    }
  }

  return groups;
};
