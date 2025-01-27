import type { Timestamp } from "firebase/firestore";

export interface UserSongLists {
  wantToLearn: string[];
  learning: string[];
  learned: string[];
  lastUpdated: Timestamp;
}

export interface SongDifficulty {
  userId: string;
  rating: number;
  date: Timestamp;
}

export type SongStatus = "wantToLearn" | "learning" | "learned";

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulties: SongDifficulty[];
  createdAt: Timestamp;
  createdBy: string;
}

export interface UserSongStatus {
  userId: string;
  songId: string;
  status: SongStatus;
  updatedAt: Timestamp;
}