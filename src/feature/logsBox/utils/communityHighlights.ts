import { BOSS_PLAN_PREFIX } from "feature/bosses/data/bosses";
import type { FirebaseLogsInterface } from "feature/logs/types/logs.type";
import {
  type AnyFirebaseLog,
  isFirebaseLogsDuelResult,
  isFirebaseLogsDuelWaiting,
  isFirebaseLogsGuildLevel,
} from "feature/logs/utils/groupConsecutiveLogs";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** The strip holds this many cells; the freshest ones win. */
export const MAX_HIGHLIGHTS = 4;
/** A feed event older than this is no longer news. */
export const HIGHLIGHT_MAX_AGE_MS = 2 * DAY_MS;
/** The monthly board has no "last event", so it ranks as if it were this old… */
const CHALLENGE_STANDING_AGE_MS = DAY_MS;
/** …until it is about to close, when it moves to the front. */
export const CHALLENGE_URGENT_DAYS = 3;

export type CommunityHighlight =
  | {
      kind: "improv";
      at: number;
      userName: string;
      trackTitle: string;
      youtubeId: string;
    }
  | {
      kind: "challenge";
      at: number;
      daysLeft: number;
      submissionCount: number;
      isUrgent: boolean;
    }
  | { kind: "duelWaiting"; at: number }
  | {
      kind: "duelResult";
      at: number;
      winner: string;
      loser: string;
      winnerAvatar: string | null;
      loserAvatar: string | null;
      isDraw: boolean;
    }
  | {
      kind: "boss";
      at: number;
      userName: string;
      avatarUrl: string | null;
      bossTitle: string;
      phase: number;
    }
  | { kind: "guild"; at: number; guildName: string; level: number };

export interface HighlightSources {
  logs: AnyFirebaseLog[];
  /** The newest take of the live improv round, if it has one. */
  improvTake?: {
    userName: string;
    createdAt: number;
    trackTitle: string;
    youtubeId: string;
  } | null;
  /** The live monthly board, if it is drawn. */
  challenge?: { daysLeft: number; submissionCount: number } | null;
  now: number;
}

const logTime = (log: AnyFirebaseLog): number => {
  const raw =
    (log as { timestamp?: string | number | Date }).timestamp ??
    (log as { data?: string }).data;
  const time = new Date(raw as string | number | Date).getTime();
  return Number.isNaN(time) ? 0 : time;
};

/** Keeps whichever of the two happened later. */
const newer = <T extends { at: number }>(current: T | null, next: T): T =>
  current && current.at >= next.at ? current : next;

/**
 * What the feed's logs have to say: an open duel (or the last one settled), the
 * last boss phase cleared, the last guild level-up. One of each, and only
 * while it is still fresh.
 */
const highlightsFromLogs = (
  logs: AnyFirebaseLog[],
  now: number,
): CommunityHighlight[] => {
  let duelWaiting: Extract<CommunityHighlight, { kind: "duelWaiting" }> | null =
    null;
  let duelResult: Extract<CommunityHighlight, { kind: "duelResult" }> | null =
    null;
  let boss: Extract<CommunityHighlight, { kind: "boss" }> | null = null;
  let guild: Extract<CommunityHighlight, { kind: "guild" }> | null = null;

  for (const log of logs) {
    const at = logTime(log);
    if (now - at > HIGHLIGHT_MAX_AGE_MS) continue;

    if (isFirebaseLogsDuelWaiting(log)) {
      if (log.expiresAt > now)
        duelWaiting = newer(duelWaiting, { kind: "duelWaiting" as const, at });
      continue;
    }

    if (isFirebaseLogsDuelResult(log)) {
      const [first, second] = log.players;
      duelResult = newer(duelResult, {
        kind: "duelResult" as const,
        at,
        winner: first.displayName,
        loser: second.displayName,
        winnerAvatar: first.avatar || null,
        loserAvatar: second.avatar || null,
        isDraw: log.kind === "draw",
      });
      continue;
    }

    if (isFirebaseLogsGuildLevel(log)) {
      guild = newer(guild, {
        kind: "guild" as const,
        at,
        guildName: log.guildName,
        level: log.level,
      });
      continue;
    }

    const session = log as FirebaseLogsInterface;
    if (!session.userName || !session.exerciseTitle) continue;

    if (session.planId?.startsWith(BOSS_PLAN_PREFIX)) {
      if (session.bossRun)
        boss = newer(boss, {
          kind: "boss" as const,
          at,
          userName: session.userName,
          avatarUrl: session.avatarUrl ?? null,
          bossTitle: session.exerciseTitle,
          phase: session.bossRun.phase,
        });
    }
  }

  // Somebody waiting right now can be acted on; a settled duel is only news.
  const duel = duelWaiting ?? duelResult;

  return [duel, boss, guild].filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
};

/**
 * The cells of the "what's going on" strip next to Live Now: at most
 * {@link MAX_HIGHLIGHTS}, freshest first, so the strip changes as things happen
 * instead of showing the same four forever.
 */
export const buildCommunityHighlights = ({
  logs,
  improvTake,
  challenge,
  now,
}: HighlightSources): CommunityHighlight[] => {
  const items = highlightsFromLogs(logs, now);

  if (improvTake)
    items.push({
      kind: "improv",
      at: improvTake.createdAt,
      userName: improvTake.userName,
      trackTitle: improvTake.trackTitle,
      youtubeId: improvTake.youtubeId,
    });

  if (challenge && challenge.daysLeft > 0) {
    const isUrgent = challenge.daysLeft <= CHALLENGE_URGENT_DAYS;
    items.push({
      kind: "challenge",
      at: isUrgent ? now : now - CHALLENGE_STANDING_AGE_MS,
      daysLeft: challenge.daysLeft,
      submissionCount: challenge.submissionCount,
      isUrgent,
    });
  }

  return items.sort((a, b) => b.at - a.at).slice(0, MAX_HIGHLIGHTS);
};
