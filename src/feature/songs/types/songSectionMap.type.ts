/**
 * Structurally matches both the client SDK's `Timestamp` (firebase/firestore)
 * and the Admin SDK's `Timestamp` (firebase-admin/firestore) — this type is
 * written by API routes (Admin SDK) and read by the client (client SDK), so
 * it can't be pinned to either SDK's concrete class.
 */
export interface TimestampLike {
  seconds: number;
  nanoseconds: number;
}

/** Positional data only — never includes personal `mastery`, which stays in userSongs. */
export interface SectionMapEntry {
  name: string;
  startTime: number; // seconds
}

export interface SongSectionMapSubmission {
  userId: string;
  /** Resolved server-side from users/{uid}.displayName — never client-supplied. */
  username: string;
  sections: SectionMapEntry[];
  /** Concrete Timestamp.now(), not serverTimestamp() — unsupported inside array elements. */
  submittedAt: TimestampLike;
}

export interface SongSectionMapConsensusSection {
  name: string;
  startTime: number;
  /** Number of distinct contributing users clustered into this section. */
  confirmations: number;
}

export type SongSectionMapStatus = "pending" | "verified";

export interface SongSectionMap {
  id: string; // `${songId}__${videoId}`
  songId: string;
  videoId: string;
  /** One entry per userId — upsert-by-userId on resubmission. */
  submissions: SongSectionMapSubmission[];
  /** Only clusters that reached MIN_CONFIRMATIONS. */
  consensusSections: SongSectionMapConsensusSection[];
  contributorCount: number;
  status: SongSectionMapStatus;
  updatedAt: TimestampLike;
}
