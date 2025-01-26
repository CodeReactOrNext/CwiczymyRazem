import type { Timestamp } from "firebase/firestore";
import type { StatisticsDataInterface } from "types/api.types";
import type { SkillsType } from "types/skillsTypes";

export interface FirebaseUserDataInterface {
  profileId: string;
  createdAt: Timestamp;
  displayName: string;
  avatar?: string;
  soundCloudLink?: string;
  youTubeLink?: string;
  band?: string;
  guitarStartDate?: Timestamp;
  statistics: StatisticsDataInterface;
  songLists: UserSongLists;
}

export interface UserSongLists {
  wantToLearn: string[];
  learning: string[];
  learned: string[];
  lastUpdated: Timestamp;
}



export interface FirebaseEventsInteface {
  category: SkillsType;
  name: string;
  link: string;
}
export interface FirebaseDiscordEventsInteface {
  title: string;
  deadline: string;
  description: string;
  link: string;
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
