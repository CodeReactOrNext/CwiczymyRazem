import type { Timestamp } from "firebase/firestore";

export interface Comment {
  id: string;
  userId: string;
  userName?: string | null;
  userAvatarUrl?: string | null;
  userAvatarFrame?: number;
  content: string;
  createdAt: Timestamp;
}

export interface Recording {
  id: string;
  userId: string;
  userDisplayName?: string | null;
  userAvatarUrl?: string | null;
  userAvatarFrame?: number;
  songId?: string | null;
  songTitle?: string | null;
  songArtist?: string | null;
  videoUrl: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  likes: string[];
  commentCount: number;
}

export interface RecordingCreateData {
  videoUrl: string;
  title: string;
  description: string;
  songId?: string | null;
  songTitle?: string | null;
  songArtist?: string | null;
}
