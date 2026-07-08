import type { Timestamp } from "firebase/firestore";

/**
 * - playlist: free-form collection, any length
 * - path: ordered learning journey — songs are meant to be learned in order,
 *   progress is derived from the user's "learned" list
 * - top: ranked list capped at TOP_LIST_LIMIT, rendered with big rank numerals
 */
export type PlaylistKind = "playlist" | "path" | "top";

export const TOP_LIST_LIMIT = 10;

/**
 * Songs are embedded as lightweight snapshots so a playlist renders with a
 * single doc read. Snapshot fields can drift from the source song — acceptable
 * for title/artist/cover; anything interactive refetches the full song by id.
 */
export interface PlaylistSongEntry {
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  tier?: string;
  avgDifficulty?: number;
  addedAt: Timestamp;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  kind: PlaylistKind;
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
  isPublic: boolean;
  songs: PlaylistSongEntry[];
  /** How many times other users copied this playlist into their library. */
  importCount: number;
  /** How many users liked this playlist. */
  likeCount?: number;
  /** User ids who liked it — drives the toggle and prevents double-liking. */
  likes?: string[];
  importedFrom?: { playlistId: string; ownerName?: string };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Fame awarded to the author when their playlist is saved / liked. */
export const FAME_ON_SAVE = 20;
export const FAME_ON_LIKE = 5;

/**
 * Popularity score used to rank Discover. A save (import) is a stronger signal
 * than a like — someone put the whole list in their own library — so it weighs
 * more heavily.
 */
export const getPlaylistPopularity = (playlist: {
  importCount?: number;
  likeCount?: number;
}): number => (playlist.importCount ?? 0) * 3 + (playlist.likeCount ?? 0);

export interface PlaylistDraft {
  name: string;
  description?: string;
  kind: PlaylistKind;
  isPublic: boolean;
  songs: PlaylistSongEntry[];
}
