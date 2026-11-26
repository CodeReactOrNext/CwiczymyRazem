import {
  calculateGroupFame,
  getGroupSessionMs,
} from "feature/logs/utils/activityFame";
import {
  type AnyFirebaseLog,
  dropIncompleteTailGroup,
  groupConsecutiveLogs,
} from "feature/logs/utils/groupConsecutiveLogs";
import {
  getGroupReactionAnchor,
  getGroupReactors,
} from "feature/logs/utils/groupReactions";

/**
 * Picks: the post-session way to motivate. After a session the player gets a few guitar picks to
 * toss at people who practiced in the last day — the ones nobody has motivated yet come first.
 * A tossed pick is a Motivate on that player's activity (same Fame, same row, same "already
 * motivated" check), only drawn from a small daily allowance.
 */

/** Picks one player can toss in one (UTC) day. */
export const PICKS_PER_DAY = 5;

/** How far back the summary looks for players to toss a pick at. */
export const PICK_TARGET_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Newest feed logs the target list is built from. */
export const PICK_TARGET_SCAN_LIMIT = 80;

/** Players offered at once; the rest wait behind "Show others". */
export const PICK_TARGETS_SHOWN = 3;

/** Players the server sends: enough for one "Show others". */
export const PICK_TARGETS_MAX = 6;

/** Fame the thrower gets for one pick — the same as for a Motivate in the feed. */
export const PICK_THROWER_FAME = 1;

/** The UTC day the daily allowance counts in. */
export const pickDayKey = (nowMs: number): string =>
  new Date(nowMs).toISOString().slice(0, 10);

/** What `pickThrowers/{uid}` stores: how many picks went out on which day. */
export interface PickThrowerRecord {
  day: string;
  count: number;
}

export const picksLeftToday = (
  record: PickThrowerRecord | null | undefined,
  nowMs: number,
): number => {
  const used = record && record.day === pickDayKey(nowMs) ? record.count : 0;
  return Math.max(0, PICKS_PER_DAY - used);
};

export type PickThrowDecision =
  | { ok: false; reason: "DAILY_LIMIT" }
  | { ok: true; record: PickThrowerRecord; picksLeft: number };

/** Spends one pick from the allowance, or says the day's picks are gone. */
export const decidePickThrow = (
  record: PickThrowerRecord | null | undefined,
  nowMs: number,
): PickThrowDecision => {
  const left = picksLeftToday(record, nowMs);
  if (left <= 0) return { ok: false, reason: "DAILY_LIMIT" };

  const day = pickDayKey(nowMs);
  const used = record && record.day === day ? record.count : 0;
  return { ok: true, record: { day, count: used + 1 }, picksLeft: left - 1 };
};

/** One player the summary offers a pick to. */
export interface PickTarget {
  /** The log a pick lands on: the anchor of the player's newest practice row. */
  logId: string;
  uid: string;
  userName: string;
  avatarUrl: string | null;
  userAvatarFrame?: number;
  /** Minutes practiced in that row. */
  minutes: number;
  /** What the row was called (plan, exercise, song), when it has a name. */
  title: string | null;
  /** How many players already motivated that row. */
  motivations: number;
  /** Fame the player gets for the pick. */
  fame: number;
  /** When the row's newest activity happened (ISO). */
  timestamp: string;
}

/** What `/api/picks/throw` answers. */
export interface PickThrowResponse {
  /** The pick landed and was paid for. */
  thrown: boolean;
  /** The thrower had already motivated that activity: nothing paid, no pick spent. */
  alreadyMotivated: boolean;
  /** Fame the player who caught it received. */
  fameAwarded: number;
  /** Fame the thrower received. */
  throwerFame: number;
  picksLeft: number;
}

export interface PickTargetsResponse {
  picksLeft: number;
  perDay: number;
  targets: PickTarget[];
}

type LogWithId = AnyFirebaseLog & { id?: string };

const logTime = (log: AnyFirebaseLog): number => {
  const raw = (log as { timestamp?: string | number | Date }).timestamp;
  const time = new Date(raw as string | number | Date).getTime();
  return Number.isFinite(time) ? time : 0;
};

const readString = (log: AnyFirebaseLog, key: string): string | null => {
  const value = (log as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
};

/**
 * The players worth a pick, from the newest feed logs (newest first, as Firestore returns them):
 * one practice row per player, from the last day, not the viewer's own and not one the viewer has
 * already motivated. Rows nobody has motivated come first, then the most recent.
 *
 * Grouping is the feed's own, so a pick lands on the exact row the feed shows. The group cut in
 * half by the scan limit is dropped — its reactions may sit on logs the scan never saw.
 */
export const buildPickTargets = ({
  logs,
  viewerId,
  nowMs,
  hasOlderLogs,
  limit = PICK_TARGETS_MAX,
}: {
  logs: LogWithId[];
  viewerId: string;
  nowMs: number;
  hasOlderLogs: boolean;
  limit?: number;
}): PickTarget[] => {
  const groups = dropIncompleteTailGroup(
    groupConsecutiveLogs(logs),
    hasOlderLogs,
  );
  const seen = new Set<string>();
  const targets: PickTarget[] = [];

  for (const group of groups) {
    const uid = group.uid;
    if (!uid || uid === viewerId || seen.has(uid)) continue;

    const sessionMs = getGroupSessionMs(group.logs);
    if (sessionMs <= 0) continue;

    const newest = group.logs[0];
    if (nowMs - logTime(newest) > PICK_TARGET_WINDOW_MS) continue;

    // Only the newest practice row counts per player, motivated or not: an older row of theirs
    // would otherwise slip in once the viewer has motivated the newest.
    seen.add(uid);

    const reactors = getGroupReactors(group);
    if (reactors.includes(viewerId)) continue;

    const anchor = getGroupReactionAnchor(group) as LogWithId | undefined;
    if (!anchor?.id) continue;

    targets.push({
      logId: anchor.id,
      uid,
      userName: readString(newest, "userName") ?? "Player",
      avatarUrl: readString(newest, "avatarUrl"),
      userAvatarFrame: (newest as { userAvatarFrame?: number }).userAvatarFrame,
      minutes: Math.max(1, Math.round(sessionMs / 60000)),
      title:
        readString(newest, "exerciseTitle") ?? readString(newest, "songTitle"),
      motivations: reactors.length,
      fame: calculateGroupFame(group),
      timestamp: new Date(logTime(newest)).toISOString(),
    });
  }

  // Stable sort: among rows with as many motivations, the feed order (newest first) stays.
  return targets.sort((a, b) => a.motivations - b.motivations).slice(0, limit);
};
