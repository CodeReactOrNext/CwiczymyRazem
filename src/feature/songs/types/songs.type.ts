import type { Timestamp } from "firebase/firestore";

export interface UserSongLists {
  wantToLearn: string[];
  learning: string[];
  learned: string[];
  lastUpdated: Timestamp;
}

interface SongDifficulty {
  userId: string;
  rating: number;
  date: Timestamp;
}

export type SongStatus = "wantToLearn" | "learning" | "learned";

/** Parts of a song a user can mark as playable: the riff/fragment, the solo, or the whole song. */
export type SongPart = "riff" | "solo" | "wholeSong";

/**
 * Which guitar part of a song the player practises — Rocksmith-style
 * arrangements. Each one keeps its own play time, sessions, part marks and
 * section mastery; the song-level figures stay the sum of all of them.
 */
export type SongArrangement = "lead" | "rhythm" | "bass";

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulties: SongDifficulty[];
  createdAt: Timestamp;
  createdBy: string;
  coverUrl?: string;
  coverAttempted?: boolean;
  isVerified?: boolean;
  genres?: string[];
  popularity?: number;
  practicingUsers?: string[];
  search_string?: string;
  avgDifficulty?: number;
  title_lowercase?: string;
  artist_lowercase?: string;
  tier?: string;
  spotifyId?: string;
  masteryProgress?: number;
  totalSections?: number;
}

interface UserSongStatus {
  userId: string;
  songId: string;
  status: SongStatus;
  updatedAt: Timestamp;
}