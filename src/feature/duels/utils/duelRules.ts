import type {
  DuelDoc,
  DuelFeedEntry,
  DuelFeedPlayer,
  DuelOutcome,
  DuelOutcomeKind,
  DuelPlayer,
  DuelProfile,
  DuelTicket,
  DuelView,
} from "feature/duels/types/duel.types";
import { FEATURE_UNLOCKS } from "feature/levelGate/data/featureUnlocks";

const HOUR_MS = 60 * 60 * 1000;

/** Waiting tickets and running duels together — a player never has more open. */
export const DUEL_MAX_OPEN = 3;
/** A ticket nobody answered disappears after this long. */
export const DUEL_TICKET_TTL_MS = 24 * HOUR_MS;
/** How long the two have, from the moment they are paired, to set their best. */
export const DUEL_DURATION_MS = 48 * HOUR_MS;
/**
 * A run started just before the deadline is still played out and sent after
 * it — this long past the deadline it still counts. Settlement waits for it.
 */
export const DUEL_SUBMIT_GRACE_MS = 15 * 60 * 1000;
/** A player who has not played yet hears about it this long before the end. */
export const DUEL_REMIND_BEFORE_MS = 6 * HOUR_MS;

export const DUEL_START_RATING = 1000;
/** Nobody falls below this — a floor keeps a losing streak from going nowhere. */
export const DUEL_MIN_RATING = 100;
/** The first duels move the rating faster, so a new player finds their level. */
export const DUEL_PROVISIONAL_DUELS = 10;
export const DUEL_K_PROVISIONAL = 40;
export const DUEL_K = 20;
/** Settled duels kept on a profile for "Recent duels". */
export const DUEL_RECENT_LIMIT = 10;
/** How many players the ranking lists. */
export const DUEL_RANKING_SIZE = 20;
/** How many settled duels the public feed lists. */
export const DUEL_FEED_SIZE = 20;

/** The level duels open at — the same number the level gate and the API use. */
export const DUEL_MIN_LVL = FEATURE_UNLOCKS.duels.requiredLvl;

// ── ELO ──────────────────────────────────────────────────────────────────────

/** Chance `rating` beats `opponentRating`, the classic logistic curve. */
export const expectedScore = (rating: number, opponentRating: number): number =>
  1 / (1 + 10 ** ((opponentRating - rating) / 400));

export const kFactor = (playedBefore: number): number =>
  playedBefore < DUEL_PROVISIONAL_DUELS ? DUEL_K_PROVISIONAL : DUEL_K;

/** The rating after one duel: 1 for a win, 0.5 for a draw, 0 for a loss. */
export const nextRating = (
  rating: number,
  playedBefore: number,
  opponentRating: number,
  actual: 0 | 0.5 | 1,
): number =>
  Math.max(
    DUEL_MIN_RATING,
    Math.round(
      rating +
        kFactor(playedBefore) *
          (actual - expectedScore(rating, opponentRating)),
    ),
  );

// ── Outcome ──────────────────────────────────────────────────────────────────

/**
 * Who won. Playing at all is the first test — someone who never sent a run
 * loses to someone who did, whatever they scored — then the best score.
 */
export const resolveDuelOutcome = (
  duel: Pick<DuelDoc, "playerIds" | "players">,
): { kind: DuelOutcomeKind; winnerId: string | null } => {
  const [aId, bId] = duel.playerIds;
  const a = duel.players[aId];
  const b = duel.players[bId];
  const aPlayed = (a?.attempts ?? 0) > 0;
  const bPlayed = (b?.attempts ?? 0) > 0;

  if (!aPlayed && !bPlayed) return { kind: "void", winnerId: null };
  if (aPlayed !== bPlayed)
    return { kind: "walkover", winnerId: aPlayed ? aId : bId };
  if (a.bestScore === b.bestScore) return { kind: "draw", winnerId: null };
  return { kind: "win", winnerId: a.bestScore > b.bestScore ? aId : bId };
};

export type DuelResult = "won" | "lost" | "draw" | "void";

export const resultFor = (
  outcome: Pick<DuelOutcome, "kind" | "winnerId">,
  userId: string,
): DuelResult => {
  if (outcome.kind === "void") return "void";
  if (outcome.kind === "draw") return "draw";
  return outcome.winnerId === userId ? "won" : "lost";
};

const actualScore = (result: DuelResult): 0 | 0.5 | 1 =>
  result === "won" ? 1 : result === "draw" ? 0.5 : 0;

export interface PlayerStanding {
  rating: number;
  played: number;
}

export interface DuelSettlement {
  outcome: Omit<DuelOutcome, "settledAt">;
  /** Per player: result, and the rating going in and out (equal on a void duel). */
  players: Record<
    string,
    { result: DuelResult; ratingBefore: number; ratingAfter: number }
  >;
}

/**
 * Settles a duel against the players' ratings as they stand now — not as they
 * stood at pairing, since a player can have other duels settle in between.
 * A void duel moves nobody.
 */
export const settleDuel = (
  duel: Pick<DuelDoc, "playerIds" | "players">,
  standings: Record<string, PlayerStanding>,
): DuelSettlement => {
  const outcome = resolveDuelOutcome(duel);
  const [aId, bId] = duel.playerIds;
  const standing = (id: string): PlayerStanding =>
    standings[id] ?? { rating: DUEL_START_RATING, played: 0 };

  const sideOf = (id: string, opponentId: string) => {
    const result = resultFor(outcome, id);
    const { rating, played } = standing(id);
    const ratingAfter =
      result === "void"
        ? rating
        : nextRating(
            rating,
            played,
            standing(opponentId).rating,
            actualScore(result),
          );
    return { result, ratingBefore: rating, ratingAfter };
  };

  return {
    outcome,
    players: { [aId]: sideOf(aId, bId), [bId]: sideOf(bId, aId) },
  };
};

// ── Profile bookkeeping ──────────────────────────────────────────────────────

export const liveTickets = <T extends Pick<DuelTicket, "expiresAt">>(
  tickets: readonly T[],
  now: number,
): T[] => tickets.filter((ticket) => ticket.expiresAt > now);

/** Waiting tickets that have not expired plus running duels. */
export const openDuelCount = (
  profile: Pick<DuelProfile, "tickets" | "active"> | null | undefined,
  now: number,
): number =>
  profile
    ? liveTickets(profile.tickets ?? [], now).length +
      (profile.active ?? []).length
    : 0;

export const canOpenDuel = (
  profile: Pick<DuelProfile, "tickets" | "active"> | null | undefined,
  now: number,
): boolean => openDuelCount(profile, now) < DUEL_MAX_OPEN;

/**
 * The ticket a new player is paired with: the oldest one still waiting that
 * belongs to somebody else — and to nobody they already have a duel running
 * against, so two people queueing at once never end up in three duels with
 * each other.
 */
export const pickOpponentTicket = (
  waiting: readonly DuelTicket[],
  userId: string,
  busyWith: ReadonlySet<string>,
  now: number,
): DuelTicket | null =>
  [...waiting]
    .sort((a, b) => a.createdAt - b.createdAt)
    .find(
      (ticket) =>
        ticket.userId !== userId &&
        ticket.expiresAt > now &&
        !busyWith.has(ticket.userId),
    ) ?? null;

export const pushRecent = (ids: readonly string[], duelId: string): string[] =>
  [duelId, ...ids.filter((id) => id !== duelId)].slice(0, DUEL_RECENT_LIMIT);

/** The profile fields a settled duel changes for one of its players. */
export const settledProfileUpdate = (
  profile: Pick<
    DuelProfile,
    "played" | "wins" | "losses" | "draws" | "active" | "recentDuelIds"
  >,
  duelId: string,
  side: DuelSettlement["players"][string],
  now: number,
): Partial<DuelProfile> => {
  const base: Partial<DuelProfile> = {
    active: (profile.active ?? []).filter((entry) => entry.duelId !== duelId),
    recentDuelIds: pushRecent(profile.recentDuelIds ?? [], duelId),
    updatedAt: now,
  };
  if (side.result === "void") return base;
  return {
    ...base,
    rating: side.ratingAfter,
    played: (profile.played ?? 0) + 1,
    wins: (profile.wins ?? 0) + (side.result === "won" ? 1 : 0),
    losses: (profile.losses ?? 0) + (side.result === "lost" ? 1 : 0),
    draws: (profile.draws ?? 0) + (side.result === "draw" ? 1 : 0),
  };
};

// ── What a participant may see ───────────────────────────────────────────────

/**
 * One duel from `viewerId`'s side. While it runs the opponent is a number of
 * attempts and nothing else — no name, no score, no rating — so the duel stays
 * anonymous and nobody can wait to just edge past a known score. Settled, it
 * shows everything.
 */
export const toDuelView = (
  duel: DuelDoc,
  viewerId: string,
): DuelView | null => {
  const opponentId = duel.playerIds.find((id) => id !== viewerId);
  const me = duel.players[viewerId];
  const opponent = opponentId ? duel.players[opponentId] : undefined;
  if (!me || !opponentId || !opponent) return null;

  const isFinished = duel.status === "finished" && !!duel.outcome;
  const result = isFinished ? resultFor(duel.outcome!, viewerId) : null;

  return {
    id: duel.id,
    exerciseId: duel.exerciseId,
    status: isFinished ? "finished" : "active",
    createdAt: duel.createdAt,
    endsAt: duel.endsAt,
    settledAt: isFinished ? duel.outcome!.settledAt : null,
    me: {
      attempts: me.attempts,
      isReady: !!me.readyAt,
      bestScore: me.bestScore,
      bestAccuracy: me.bestAccuracy,
      bestBpm: me.bestBpm,
      ratingBefore: me.ratingBefore,
      ratingAfter: isFinished ? (me.ratingAfter ?? me.ratingBefore) : null,
    },
    opponent: isFinished
      ? {
          revealed: true,
          userId: opponent.userId,
          displayName: opponent.displayName,
          avatar: opponent.avatar,
          lvl: opponent.lvl,
          attempts: opponent.attempts,
          bestScore: opponent.bestScore,
          bestAccuracy: opponent.bestAccuracy,
          bestBpm: opponent.bestBpm,
          ratingBefore: opponent.ratingBefore,
          ratingAfter: opponent.ratingAfter ?? opponent.ratingBefore,
        }
      : {
          revealed: false,
          attempts: opponent.attempts,
          isReady: !!opponent.readyAt,
        },
    result,
    ratingDelta: isFinished
      ? (me.ratingAfter ?? me.ratingBefore) - me.ratingBefore
      : null,
  };
};

// ── What everyone may see ────────────────────────────────────────────────────

const toFeedPlayer = (player: DuelPlayer): DuelFeedPlayer => ({
  userId: player.userId,
  displayName: player.displayName,
  avatar: player.avatar,
  lvl: player.lvl,
  attempts: player.attempts,
  bestScore: player.bestScore,
  ratingBefore: player.ratingBefore,
  ratingAfter: player.ratingAfter ?? player.ratingBefore,
});

/**
 * A duel as the public feed shows it, the winner first. Null while the duel
 * runs — nothing about a running duel leaves its two players.
 */
export const toDuelFeedEntry = (duel: DuelDoc): DuelFeedEntry | null => {
  if (duel.status !== "finished" || !duel.outcome) return null;
  const { kind, winnerId, settledAt } = duel.outcome;
  const order = winnerId
    ? [winnerId, ...duel.playerIds.filter((id) => id !== winnerId)]
    : [...duel.playerIds];
  const sides = order
    .map((id) => duel.players[id])
    .filter((player): player is DuelPlayer => !!player);
  if (sides.length !== 2) return null;

  return {
    id: duel.id,
    exerciseId: duel.exerciseId,
    settledAt,
    kind,
    players: [toFeedPlayer(sides[0]), toFeedPlayer(sides[1])],
  };
};

/**
 * The feed as one player sees it: other people's decided duels. Their own
 * already sit in their recent list, and a duel nobody played says nothing.
 */
export const feedForViewer = (
  entries: DuelFeedEntry[],
  viewerId: string,
): DuelFeedEntry[] =>
  entries.filter(
    (entry) =>
      entry.kind !== "void" &&
      entry.players.every((player) => player.userId !== viewerId),
  );

/** Whether a run sent at `now` still lands on the duel. */
export const isDuelOpenForRuns = (
  duel: Pick<DuelDoc, "status" | "endsAt">,
  now: number,
): boolean =>
  duel.status === "active" && now < duel.endsAt + DUEL_SUBMIT_GRACE_MS;

/** Whether `userId` may still send a run: the duel takes runs and they haven't pressed Ready. */
export const canPlayerRun = (
  duel: Pick<DuelDoc, "status" | "endsAt" | "players">,
  userId: string,
  now: number,
): boolean => isDuelOpenForRuns(duel, now) && !duel.players[userId]?.readyAt;

export type DuelReadyRefusal = "CLOSED" | "NO_RUN";

/**
 * Why `userId` can't press Ready now, or null when they can. Ready locks in a
 * best, so there has to be one; and past the deadline it would change nothing.
 * Pressing it twice is not refused — the second press is a no-op.
 */
export const readyRefusal = (
  duel: Pick<DuelDoc, "status" | "endsAt" | "players">,
  userId: string,
  now: number,
): DuelReadyRefusal | null => {
  if (duel.status !== "active" || now >= duel.endsAt) return "CLOSED";
  if ((duel.players[userId]?.attempts ?? 0) === 0) return "NO_RUN";
  return null;
};

/** Both players pressed Ready — nothing left to wait for. */
export const isEveryoneReady = (
  duel: Pick<DuelDoc, "playerIds" | "players">,
): boolean => duel.playerIds.every((id) => !!duel.players[id]?.readyAt);
