import type {
  FirebaseLogsCaseOpenInterface,
  FirebaseLogsDailyQuestInterface,
  FirebaseLogsDonationInterface,
  FirebaseLogsExamPassedInterface,
  FirebaseLogsInterface,
  FirebaseLogsMarketplaceInterface,
  FirebaseLogsMarketplacePurchaseInterface,
  FirebaseLogsPlaylistInterface,
  FirebaseLogsRecordingsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsSupportAskInterface,
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
  | FirebaseLogsMarketplacePurchaseInterface
  | FirebaseLogsPlaylistInterface
  | FirebaseLogsExamPassedInterface
  | FirebaseLogsSupportAskInterface
  | FirebaseLogsDonationInterface;

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

export const isFirebaseLogsMarketplacePurchase = (
  log: AnyFirebaseLog
): log is FirebaseLogsMarketplacePurchaseInterface => {
  return (log as FirebaseLogsMarketplacePurchaseInterface).type === "marketplace_purchase";
};

export const isFirebaseLogsPlaylist = (
  log: AnyFirebaseLog
): log is FirebaseLogsPlaylistInterface => {
  return (log as FirebaseLogsPlaylistInterface).type === "playlist_created";
};

export const isFirebaseLogsExamPassed = (
  log: AnyFirebaseLog
): log is FirebaseLogsExamPassedInterface => {
  return (log as FirebaseLogsExamPassedInterface).type === "journey_exam_passed";
};

export const isFirebaseLogsSupportAsk = (
  log: AnyFirebaseLog
): log is FirebaseLogsSupportAskInterface => {
  return (log as FirebaseLogsSupportAskInterface).type === "support_ask_update";
};

export const isFirebaseLogsDonation = (
  log: AnyFirebaseLog
): log is FirebaseLogsDonationInterface => {
  return (log as FirebaseLogsDonationInterface).type === "donation_received";
};

export type LogActivityType =
  | "song"
  | "recording"
  | "dailyQuest"
  | "caseOpen"
  | "marketplace"
  | "marketplacePurchase"
  | "playlist"
  | "topPlayers"
  | "examPassed"
  | "supportAsk"
  | "donationReceived"
  | "exercisePlan"
  | "exercise";

/** Classifies a log entry into a coarse activity type used for rendering and Fame rewards. */
export const getLogActivityType = (log: AnyFirebaseLog): LogActivityType => {
  if (isFirebaseLogsSongs(log)) return "song";
  if (isFirebaseLogsTopPlayers(log)) return "topPlayers";
  if (isFirebaseLogsRecording(log)) return "recording";
  if (isFirebaseLogsDailyQuest(log)) return "dailyQuest";
  if (isFirebaseLogsCaseOpen(log)) return "caseOpen";
  if (isFirebaseLogsMarketplace(log)) return "marketplace";
  if (isFirebaseLogsMarketplacePurchase(log)) return "marketplacePurchase";
  if (isFirebaseLogsPlaylist(log)) return "playlist";
  if (isFirebaseLogsExamPassed(log)) return "examPassed";
  if (isFirebaseLogsSupportAsk(log)) return "supportAsk";
  if (isFirebaseLogsDonation(log)) return "donationReceived";
  return (log as FirebaseLogsInterface).planId ? "exercisePlan" : "exercise";
};

/** Coarser grouping category: case openings and marketplace listings/purchases are all
 * guitar-arsenal activity, so they're bucketed together in the feed even though they render
 * differently. An exam pass is likewise bucketed with the practice-session log the exam
 * auto-submits right before it — same user, same moment — so they land in one card instead of two. */
export type LogGroupType =
  | Exclude<LogActivityType, "caseOpen" | "marketplace" | "marketplacePurchase" | "examPassed">
  | "arsenal";

export const getLogGroupType = (log: AnyFirebaseLog): LogGroupType => {
  const type = getLogActivityType(log);
  if (type === "caseOpen" || type === "marketplace" || type === "marketplacePurchase") return "arsenal";
  if (type === "examPassed") return "exercisePlan";
  return type;
};

const getLogUid = (log: AnyFirebaseLog): string | undefined => (log as { uid?: string }).uid;

export interface LogGroup<T extends AnyFirebaseLog = AnyFirebaseLog> {
  type: LogGroupType;
  uid?: string;
  logs: T[];
}

/**
 * Groups consecutive logs of the same activity category performed by the same user into a single
 * visual group. A different category or a different user's log breaks the group — logs that have
 * no owning user (e.g. season top-players digests) are never grouped together.
 */
export const groupConsecutiveLogs = <T extends AnyFirebaseLog>(logs: T[]): LogGroup<T>[] => {
  const groups: LogGroup<T>[] = [];

  for (const log of logs) {
    const type = getLogGroupType(log);
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

/**
 * Drops the group the feed window cut in half.
 *
 * Grouping only sees the logs it was handed, so when older logs exist below the cutoff the last
 * group can be missing members that sit just past it — and with them everything those members
 * carry: the reaction written to the group's true oldest log, and the practice time that prices
 * the row. `/api/logs/react` rebuilds the whole group from Firestore, so a half-group renders a
 * state the server disagrees with: "Motivate" offered to someone who already motivated it, a
 * short Fame total, and a click that silently withdraws the earlier reaction. Every other group
 * is bounded on both sides by a real group break, so only the tail is at risk.
 */
export const dropIncompleteTailGroup = <T extends AnyFirebaseLog>(
  groups: LogGroup<T>[],
  hasOlderLogs: boolean
): LogGroup<T>[] =>
  hasOlderLogs && groups.length > 1 ? groups.slice(0, -1) : groups;
