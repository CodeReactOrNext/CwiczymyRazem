import type { AchievementList } from "feature/achievements/types";
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
  userAvatarFrame?: number;
  id?: string;
  reactions?: string[];
  timestamp: string | number | Date;
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
  streak?: number;
  timeSumary: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  };
  avatarUrl: string | null;
  userAvatarFrame?: number;
  id?: string;
  reactions?: string[];
  planId?: string | null;
  songId?: string;
  songTitle?: string;
  songArtist?: string;
  exerciseTitle?: string;
  skillPointsGained?: Record<string, number>;
  newRecords?: {
    maxPoints?: boolean;
    longestSession?: boolean;
    maxStreak?: boolean;
    newLevel?: boolean;
  };
  exerciseRecords?: {
    micHighScore?: { exerciseTitle: string; score: number; accuracy: number };
    earTrainingHighScore?: { exerciseTitle: string; score: number };
  };
  micPerformance?: { score: number; accuracy: number };
  earTrainingPerformance?: { score: number };
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
  timestamp: string | number | Date;
}

export interface FirebaseLogsRecordingsInterface {
  uid: string;
  userName: string;
  userAvatarUrl?: string | null; // Denormalized for display
  videoUrl: string;
  recordingId?: string | null;
  recordingTitle: string;
  recordingDescription: string;
  songTitle?: string | null;
  songArtist?: string | null;
  timestamp: string | number | Date;
  type: "recording_added";
  data: string; // Generic data field if needed, or url
  avatarUrl: string | undefined | null; // For consistency with other logs
  userAvatarFrame?: number;
  id?: string;
  reactions?: string[];
}