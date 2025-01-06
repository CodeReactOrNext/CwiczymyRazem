import { Timestamp } from "firebase/firestore";
import { AchievementList } from "assets/achievements/achievementsData";
import { StatisticsDataInterface } from "types/api.types";
import { SkillsType } from "types/skillsTypes";

export interface FirebaseUserDataInterface {
  profileId: string;
  createdAt: Timestamp;
  displayName: string;
  avatar?: string;
  soundCloudLink?: string;
  youTubeLink?: string;
  band?: string;
  statistics: StatisticsDataInterface;
  songLists: UserSongLists;
}

export interface UserSongLists {
  wantToLearn: string[];
  learning: string[];
  learned: string[];
  lastUpdated: Timestamp;
}

export interface FirebaseLogsInterface {
  uid: string;
  data: string;
  userName: string;
  newAchievements: AchievementList[];
  newLevel: {
    isNewLevel: boolean;
    level: number;
  };
  points: number;
}
export type FirebaseLogsSongsStatuses =
  | "learned"
  | "wantToLearn"
  | "learning"
  | "added"
  | "difficulty_rate";
export interface FirebaseLogsSongsInterface {
  uid: string;
  data: string;
  userName: string;
  songTitle: string;
  songArtist: string;
  status: FirebaseLogsSongsStatuses;
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

export interface FirebaseUserExceriseLog {
  reportDate: any;
  bonusPoints: {
    additionalPoints: number;
    habitsCount: number;
    multiplier: number;
    streak: number;
    time: number;
    timePoints: number;
  };
  totalPoints: number;
  exceriseTitle: string;
  isDateBackReport: string;
  timeSumary: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  };
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
