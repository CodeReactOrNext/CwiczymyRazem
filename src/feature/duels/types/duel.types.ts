/**
 * Duels: two players, one exercise, 24 hours, best run wins, ELO moves.
 *
 * Everything here is written by the server only (firebase-admin) — the client
 * never reads these collections directly, it gets a masked view through
 * /api/duels/overview, so an opponent stays anonymous until the duel is settled.
 */

/** One side of a duel, as stored. */
export interface DuelPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  lvl: number;
  /** Rating going in — what the ELO change is computed from. */
  ratingBefore: number;
  /** Rated duels played before this one — picks the K-factor. */
  playedBefore: number;
  /** Best scored run so far; 0 until the first one lands. */
  bestScore: number;
  bestAccuracy: number;
  bestBpm: number | null;
  /** Every scored run sent from a duel session, best or not. */
  attempts: number;
  lastAttemptAt: number | null;
  /** Set on settlement. */
  ratingAfter?: number;
}

export type DuelOutcomeKind =
  /** Both played, one scored higher. */
  | "win"
  /** Both played, same best score. */
  | "draw"
  /** Only one of them played at all. */
  | "walkover"
  /** Neither played — no rating moves. */
  | "void";

export interface DuelOutcome {
  kind: DuelOutcomeKind;
  /** Null on a draw and on a void duel. */
  winnerId: string | null;
  settledAt: number;
}

export interface DuelDoc {
  id: string;
  exerciseId: string;
  status: "active" | "finished";
  /** When the two were paired — the 24 hours start here. */
  createdAt: number;
  /** The deadline the players see. */
  endsAt: number;
  /**
   * When the cron may settle it: the deadline plus a grace for a run started
   * just before it. Present only while the duel is active, so the cron finds
   * open duels with a single-field range query and no composite index.
   */
  settleAt?: number;
  /**
   * When the "you haven't played yet" reminder is due. Deleted once sent, for
   * the same index-free lookup as `settleAt`.
   */
  remindAt?: number;
  playerIds: [string, string];
  players: Record<string, DuelPlayer>;
  outcome?: DuelOutcome;
}

/** A player waiting in the queue for an opponent. */
export interface DuelTicket {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface DuelProfileActive {
  duelId: string;
  opponentId: string;
  endsAt: number;
}

/** Per-player duel state: rating, record, and what they have open right now. */
export interface DuelProfile {
  userId: string;
  displayName: string;
  avatar: string;
  lvl: number;
  /**
   * Absent until the first settled duel. Firestore leaves documents without the
   * ordered field out of an `orderBy`, which is what keeps unrated players off
   * the ranking without a second query condition.
   */
  rating?: number;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  /** Waiting tickets (may include expired ones the cron has not swept yet). */
  tickets: Omit<DuelTicket, "userId">[];
  active: DuelProfileActive[];
  /** Settled duels, newest first, capped. */
  recentDuelIds: string[];
  updatedAt: number;
}

// ── What the client gets ─────────────────────────────────────────────────────

/** The other side of an active duel: how hard they are trying, nothing more. */
export interface DuelOpponentHidden {
  revealed: false;
  attempts: number;
}

/** The other side once the duel is settled. */
export interface DuelOpponentRevealed {
  revealed: true;
  userId: string;
  displayName: string;
  avatar: string;
  lvl: number;
  attempts: number;
  bestScore: number;
  bestAccuracy: number;
  bestBpm: number | null;
  ratingBefore: number;
  ratingAfter: number | null;
}

export interface DuelSelfView {
  attempts: number;
  bestScore: number;
  bestAccuracy: number;
  bestBpm: number | null;
  ratingBefore: number;
  ratingAfter: number | null;
}

/** One duel as its participant sees it. */
export interface DuelView {
  id: string;
  exerciseId: string;
  status: "active" | "finished";
  createdAt: number;
  endsAt: number;
  me: DuelSelfView;
  opponent: DuelOpponentHidden | DuelOpponentRevealed;
  /** From the viewer's side; null while active. */
  result: "won" | "lost" | "draw" | "void" | null;
  /** Rating change for the viewer; null while active. */
  ratingDelta: number | null;
}

export interface DuelRankingEntry {
  userId: string;
  displayName: string;
  avatar: string;
  lvl: number;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface DuelOverview {
  /** The viewer's rating — the starting one until a duel has been settled. */
  rating: number;
  /** Whether the rating is real (a duel has been settled) or just the start. */
  isRated: boolean;
  rank: number | null;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  tickets: Omit<DuelTicket, "userId">[];
  active: DuelView[];
  recent: DuelView[];
  ranking: DuelRankingEntry[];
  rankedPlayers: number;
  /** Players waiting in the queue right now, the viewer's own tickets excluded. */
  waitingOthers: number;
}

export type DuelJoinResult =
  | { kind: "matched"; duelId: string }
  | { kind: "queued"; ticketId: string };

export interface DuelRunSubmission {
  duelId: string;
  score: number;
  accuracy: number;
  bpm?: number;
}

export interface DuelRunResult {
  attempts: number;
  bestScore: number;
  isNewBest: boolean;
}
