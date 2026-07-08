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

export type ActivityFeedLog =
  | FirebaseLogsInterface
  | FirebaseLogsSongsInterface
  | FirebaseLogsTopPlayersInterface
  | FirebaseLogsRecordingsInterface
  | FirebaseLogsDailyQuestInterface
  | FirebaseLogsCaseOpenInterface
  | FirebaseLogsMarketplaceInterface
  | FirebaseLogsPlaylistInterface;

export type ActivityLogGroupCategory = "exercise" | "plan" | "song" | "other";

export interface ActivityLogGroup<T extends ActivityFeedLog = ActivityFeedLog> {
  key: string;
  category: ActivityLogGroupCategory;
  logs: T[];
  /** Fame to show for this feed item, or null for activity types the feed doesn't reward. */
  fame: number | null;
}

export const FAME_PER_GROUPED_ACTION = 5;
export const FAME_GROUP_CAP = 50;
export const EXERCISE_PLAN_FAME = 15;

const isSongLog = (log: ActivityFeedLog): log is FirebaseLogsSongsInterface =>
  !("type" in log) &&
  typeof (log as FirebaseLogsSongsInterface).status === "string";

const isExerciseReportLog = (
  log: ActivityFeedLog,
): log is FirebaseLogsInterface => !("type" in log) && !isSongLog(log);

interface LogClassification {
  category: ActivityLogGroupCategory;
  uid?: string;
  groupKey: string;
}

const classifyLog = (log: ActivityFeedLog): LogClassification => {
  if (isSongLog(log)) {
    return { category: "song", uid: log.uid, groupKey: `song:${log.status}` };
  }
  if (isExerciseReportLog(log)) {
    return log.planId
      ? { category: "plan", uid: log.uid, groupKey: "plan" }
      : { category: "exercise", uid: log.uid, groupKey: "exercise" };
  }
  const otherLog = log as { uid?: string; type?: string };
  return {
    category: "other",
    uid: otherLog.uid,
    groupKey: `other:${otherLog.type ?? "unknown"}`,
  };
};

const calculateFame = (
  category: ActivityLogGroupCategory,
  actionCount: number,
): number | null => {
  switch (category) {
    case "plan":
      return EXERCISE_PLAN_FAME;
    case "exercise":
    case "song":
      return Math.min(actionCount * FAME_PER_GROUPED_ACTION, FAME_GROUP_CAP);
    default:
      return null;
  }
};

/**
 * Collapses sequential Activity Feed entries from the same user and of the
 * same type into a single feed item (e.g. 6 exercises practiced in a row
 * become one entry). A different user or a different activity type in
 * between always starts a new group. Exercise Plans are never merged with
 * anything — each stays its own feed entry with a fixed Fame reward.
 */
export const groupActivityLogs = (
  logs: ActivityFeedLog[],
): ActivityLogGroup[] => {
  const groups: (LogClassification & { logs: ActivityFeedLog[] })[] = [];

  logs.forEach((log) => {
    const classification = classifyLog(log);
    const isGroupable =
      classification.category === "exercise" ||
      classification.category === "song";
    const previous = groups[groups.length - 1];

    if (
      isGroupable &&
      previous &&
      previous.category === classification.category &&
      previous.groupKey === classification.groupKey &&
      previous.uid === classification.uid
    ) {
      previous.logs.push(log);
    } else {
      groups.push({ ...classification, logs: [log] });
    }
  });

  return groups.map((group, index) => {
    const firstLog = group.logs[0] as ActivityFeedLog & {
      id?: string;
      timestamp?: unknown;
    };
    return {
      key: `${group.groupKey}-${group.uid ?? "unknown"}-${index}-${firstLog.id ?? String(firstLog.timestamp)}`,
      category: group.category,
      logs: group.logs,
      fame: calculateFame(group.category, group.logs.length),
    };
  });
};
