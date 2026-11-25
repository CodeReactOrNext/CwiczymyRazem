import type { CurrentActivityInterface } from "types/api.types";

/** Fame the player who is practicing gets for one live motivation. */
export const LIVE_MOTIVATE_FAME = 15;

/** Fame the motivator gets for sending one. */
export const LIVE_MOTIVATE_SENDER_FAME = 3;

/** Extra Fame for the player when enough people motivate them close together. */
export const LIVE_HYPE_BONUS = 10;

/** How many motivations inside the window make a Hype. */
export const LIVE_HYPE_COUNT = 3;

export const LIVE_HYPE_WINDOW_MS = 60 * 1000;

/** Live motivations one player can receive in one session. */
export const LIVE_MOTIVATE_MAX_PER_SESSION = 10;

/** Live motivations one player can send in one (UTC) day. */
export const LIVE_MOTIVATE_MAX_PER_DAY = 10;

/**
 * The session a live motivation belongs to. `sessionStartedAt` stays the same across the
 * exercises of a plan; activities that never set it (songs, lessons) start once, so their
 * `timestamp` already names the session.
 */
export const liveSessionKey = (
  activity: Pick<CurrentActivityInterface, "timestamp" | "sessionStartedAt">,
): number => activity.sessionStartedAt ?? activity.timestamp;

/** The UTC day the sender's daily limit counts in. */
export const liveDayKey = (nowMs: number): string =>
  new Date(nowMs).toISOString().slice(0, 10);

/** What `/api/presence/motivate` answers. */
export interface LiveMotivateResponse {
  /** Fame the player received, Hype bonus included (0 when nothing was paid). */
  fameAwarded: number;
  /** Fame the motivator received. */
  senderFame: number;
  hype: boolean;
  /** The motivator had already motivated this session, so nothing new was paid. */
  alreadyMotivated: boolean;
}

export interface LiveSessionRecord {
  /** Who motivated, in order. */
  motivators: string[];
  /** When each motivation landed (ms), same order as `motivators`. */
  times: number[];
  hypeAwarded: boolean;
}

export interface LiveSenderRecord {
  day: string;
  count: number;
}

export type LiveMotivateRefusal =
  | "SELF"
  | "ALREADY"
  | "SESSION_FULL"
  | "DAILY_LIMIT";

export type LiveMotivateDecision =
  | { ok: false; reason: LiveMotivateRefusal }
  | {
      ok: true;
      /** Fame for the player: the motivation plus the Hype bonus when this one completes it. */
      recipientFame: number;
      hype: boolean;
      hypeCount: number;
      session: LiveSessionRecord;
      sender: LiveSenderRecord;
    };

/**
 * Prices one live motivation from the stored session and sender records. Pure, so the API
 * route runs it inside its transaction and the tests run it on plain data.
 */
export const decideLiveMotivate = ({
  senderId,
  recipientId,
  nowMs,
  session,
  sender,
}: {
  senderId: string;
  recipientId: string;
  nowMs: number;
  session: LiveSessionRecord | null;
  sender: LiveSenderRecord | null;
}): LiveMotivateDecision => {
  if (senderId === recipientId) return { ok: false, reason: "SELF" };

  const current: LiveSessionRecord = session ?? {
    motivators: [],
    times: [],
    hypeAwarded: false,
  };
  if (current.motivators.includes(senderId)) return { ok: false, reason: "ALREADY" };
  if (current.motivators.length >= LIVE_MOTIVATE_MAX_PER_SESSION) {
    return { ok: false, reason: "SESSION_FULL" };
  }

  const today = liveDayKey(nowMs);
  const sentToday = sender && sender.day === today ? sender.count : 0;
  if (sentToday >= LIVE_MOTIVATE_MAX_PER_DAY) return { ok: false, reason: "DAILY_LIMIT" };

  const times = [...current.times, nowMs];
  const recent = times.filter((t) => nowMs - t <= LIVE_HYPE_WINDOW_MS).length;
  const hype = !current.hypeAwarded && recent >= LIVE_HYPE_COUNT;

  return {
    ok: true,
    recipientFame: LIVE_MOTIVATE_FAME + (hype ? LIVE_HYPE_BONUS : 0),
    hype,
    hypeCount: recent,
    session: {
      motivators: [...current.motivators, senderId],
      times,
      hypeAwarded: current.hypeAwarded || hype,
    },
    sender: { day: today, count: sentToday + 1 },
  };
};
