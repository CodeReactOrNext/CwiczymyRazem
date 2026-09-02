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
  updatedAt?: Timestamp;
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

/** Editable fields of an existing recording — everything else on the doc is
 *  author metadata, likes or counters the owner must not overwrite. */
export type RecordingUpdateData = RecordingCreateData;
