/** A round lasts this long, then the next backing track takes over. */
export const IMPROV_ROUND_DAYS = 5;

/** Paid for every take, up to the per-round cap. */
export const IMPROV_POINTS_PER_TAKE = 50;
/** Paid once per round, with the first take. */
export const IMPROV_FAME_FOR_JOINING = 100;
/** One player may put this many takes on a round. */
export const IMPROV_MAX_TAKES_PER_ROUND = 3;

/** A player may have this many backing tracks waiting in the pool at once. */
export const IMPROV_MAX_POOL_TRACKS_PER_USER = 2;

export const IMPROV_NOTE_MAX = 160;

export type ImprovTakeProvider = "youtube" | "instagram" | "drive";

/**
 * A backing track is a YouTube video and nothing else: whoever adds one only
 * pastes the link, and the name and channel are read from YouTube.
 */
export interface ImprovTrackInfo {
  /** The video's 11-character id. */
  youtubeId: string;
  /** The video's title on YouTube. */
  title: string;
  /** The YouTube channel it is on. */
  channel: string;
}

/** A backing track waiting in the pool for votes. */
export interface ImprovTrack extends ImprovTrackInfo {
  id: string;
  uploadedById: string;
  uploadedByName: string;
  voteCount: number;
  hasMyVote: boolean;
  createdAt: number;
}

/** One five-day round: the pool's winner, frozen. */
export interface ImprovRound extends ImprovTrackInfo {
  id: string;
  /** 1-based, counts every five-day window since the first. */
  number: number;
  uploadedByName: string;
  startsAt: number;
  endsAt: number;
  takeCount: number;
  playerCount: number;
  /** Null until the bot has opened the round's thread. */
  discordThreadUrl: string | null;
}

export interface ImprovTake {
  id: string;
  roundId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  url: string;
  provider: ImprovTakeProvider;
  note: string;
  /** This player's 1st, 2nd or 3rd take of the round. */
  takeNumber: number;
  createdAt: number;
  /** The bot's message about this take, when it got through. */
  discordUrl: string | null;
}

export interface ImprovOverview {
  now: number;
  /** Null when the pool was empty at the start of this window. */
  round: ImprovRound | null;
  takes: ImprovTake[];
  /** Most-backed first: the first one is the next round. */
  pool: ImprovTrack[];
  past: ImprovRound[];
  nextRoundStartsAt: number;
  isAdmin: boolean;
  /** Admins only: why the round has no Discord thread, when it hasn't. */
  discordIssue: string | null;
}

export interface ImprovTakeResult {
  take: ImprovTake;
  points: number;
  fame: number;
}

export type ImprovErrorCode =
  | "BAD_LINK"
  | "BAD_TRACK"
  | "NO_ROUND"
  | "LIMIT"
  | "DUPLICATE"
  | "NOT_FOUND"
  | "FORBIDDEN";
