import type { AchievementList } from "feature/achievements/achievementsData";
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";

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
  difficulty_rate?: number;
  status: FirebaseLogsSongsStatuses;
  avatarUrl: string | undefined;
  id?: string;
  reactions?: string[];
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
  avatarUrl: string | undefined;
  planId?: string | null;
  songId?: string;
  songTitle?: string;
  songArtist?: string;
}

export interface FirebaseLogsInterface {
  timestamp: string | number | Date;
  uid: string;
  data: string;
  userName: string;
  newAchievements: AchievementList[];
  newLevel: {
    isNewLevel: boolean;
    level: number;
  };
  points: number;
  timeSumary: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  };
  avatarUrl: string | null;
  id?: string;
  reactions?: string[];
  planId?: string | null;
  songId?: string;
  songTitle?: string;
  songArtist?: string;
}

export interface FirebaseLogsAchievementsInterface {
  uid: string;
  userName: string;
  achievements: AchievementList[];
  timestamp: string | number | Date;
  data?: string;
  avatarUrl: string | null;
}

export interface FirebaseLogsLvlInterface {
  uid: string;
  userName: string;
  lvl: number;
  timestamp: string | number | Date;
  data?: string;
  avatarUrl: string | null;
}

export interface FirebaseLogsTopPlayersInterface {
  type: "top_players_update";
  data: string;
  topPlayers: TopPlayerData[];
  message: string;
  daysLeftInSeason?: number;
  id?: string;
  reactions?: string[];
}