import type { Timestamp } from "firebase/firestore";

/** How many songs make up one monthly board. */
export const CHALLENGE_SONG_COUNT = 5;

/** Reward for a single accepted challenge recording. */
export const POINTS_PER_SUBMISSION = 100;
export const FAME_PER_SUBMISSION = 300;
/** Extra fame once every song on the board has a recording. */
export const FAME_CLEAR_BONUS = 500;

/** How many nominations one player may back per voting cycle. */
export const VOTES_PER_USER = 5;

export type ChallengeStatus = "active" | "archived";

/**
 * Song snapshot embedded in the challenge doc — same trade-off as playlists:
 * the board renders from a single read, anything interactive refetches by id.
 */
export interface ChallengeSong {
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  tier?: string;
  avgDifficulty?: number;
  /** Votes the song carried when the board was drawn — its mandate. */
  votes: number;
}

export interface Challenge {
  /** `YYYY-MM` — the month the board is live. */
  id: string;
  title: string;
  status: ChallengeStatus;
  songs: ChallengeSong[];
  startsAt: Timestamp;
  endsAt: Timestamp;
  /** Denormalised counters, maintained on submit. */
  submissionCount: number;
  finisherCount: number;
  createdAt: Timestamp;
}

export interface ChallengeSubmission {
  /** `${challengeId}__${userId}__${songId}` — one per song per player. */
  id: string;
  challengeId: string;
  songId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  /** The recording this points at — opens in the shared recording modal. */
  recordingId: string;
  videoUrl: string;
  title: string;
  createdAt: Timestamp;
}

export interface ChallengeNomination {
  /** `${challengeId}__${songId}` — one nomination per song per cycle. */
  id: string;
  /** The challenge (month) this nomination is running for. */
  challengeId: string;
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  tier?: string;
  avgDifficulty?: number;
  nominatedBy: string;
  nominatedByName: string;
  voteCount: number;
  voters: Array<{ id: string; name: string }>;
  createdAt: Timestamp;
  /** How many consecutive months this song didn't make the board. Increments each month it's not in top 5. Auto-cleaned at 3. */
  monthsWithoutBoardEntry?: number;
}

export const submissionDocId = (
  challengeId: string,
  userId: string,
  songId: string,
) => `${challengeId}__${userId}__${songId}`;

export const nominationDocId = (challengeId: string, songId: string) =>
  `${challengeId}__${songId}`;
