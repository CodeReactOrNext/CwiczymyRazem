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
}

export interface FirebaseLogsAchievementsInterface {
  uid: string;
  userName: string;
  achievements: AchievementList[];
  timestamp: string | number | Date;
  data?: string;
}

export interface FirebaseLogsLvlInterface {
  uid: string;
  userName: string;
  lvl: number;
  timestamp: string | number | Date;
  data?: string;
}

export interface FirebaseLogsTopPlayersInterface {
  type: "top_players_update";
  data: string;
  topPlayers: TopPlayerData[];
  message: string;
  daysLeftInSeason?: number;
}