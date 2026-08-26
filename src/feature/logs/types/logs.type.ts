import type { AchievementList } from "feature/achievements/types";
import type { EffectInventoryItem, InventoryItem } from "feature/arsenal/types/arsenal.types";
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import type { SupportVariantId } from "feature/support/content/supportVariants";
import type { ReportSongEntry } from "feature/user/view/ReportView/ReportView.types";

/**
 * Fame each reactor was actually granted when they motivated this log, keyed by their uid.
 * Written only by `/api/logs/react` (Admin SDK) so undoing a reaction refunds exactly what was
 * awarded, even if the row's grouping — and therefore its current payout — changed since.
 */
export type LogReactionFame = Record<string, number>;

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
  songId?: string;
  difficulty_rate?: number;
  status: FirebaseLogsSongsStatuses;
  avatarUrl: string | undefined;
  userAvatarFrame?: number;
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
  timestamp: string | number | Date;
}

export interface FirebaseUserExceriseLog {
  /** Firestore doc id (reportDate ISO string) — needed to edit/delete a report. */
  id?: string;
  description?: string;
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
  /**
   * Full breakdown of a multi-song session. Absent on single-song and older
   * reports, where `songId`/`songTitle`/`songArtist` alone describe the session.
   */
  songs?: ReportSongEntry[];
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
  reactionFame?: LogReactionFame;
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
  micPerformance?: {
    score: number;
    accuracy: number;
    /**
     * Tempo the run was played at, speed multiplier included. Absent on logs
     * written before tempo was recorded and on exercises with no metronome.
     */
    bpm?: number;
    /**
     * 1-based place on the exercise leaderboard when this score was reported.
     * A snapshot, not a live standing — later runs by other players move it.
     */
    rank?: number;
  };
  earTrainingPerformance?: {
    score: number;
    /**
     * 1-based place on the exercise leaderboard when this score was reported.
     * A snapshot, not a live standing — later runs by other players move it.
     */
    rank?: number;
  };
}

interface FirebaseLogsAchievementsInterface {
  uid: string;
  userName: string;
  achievements: AchievementList[];
  timestamp: string | number | Date;
  data?: string;
  avatarUrl: string | null;
}

interface FirebaseLogsLvlInterface {
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
  reactionFame?: LogReactionFame;
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
  reactionFame?: LogReactionFame;
}

export interface FirebaseLogsPlaylistInterface {
  type: "playlist_created";
  uid: string;
  userName: string;
  avatarUrl: string | null;
  userAvatarFrame?: number;
  timestamp: string | number | Date;
  data: string;
  playlistId: string;
  playlistName: string;
  playlistKind: "playlist" | "path" | "top";
  songCount: number;
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
}

export interface FirebaseLogsDailyQuestInterface {
  uid: string;
  userName: string;
  timestamp: string | number | Date;
  type: "daily_quest_completed";
  data: string;
  points: number;
  avatarUrl: string | null;
  userAvatarFrame?: number;
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
}

export interface FirebaseLogsExamPassedInterface {
  uid: string;
  userName: string;
  timestamp: string | number | Date;
  type: "journey_exam_passed";
  data: string;
  moduleId: string;
  moduleTitle: string;
  stepId: string;
  stepTitle: string;
  stars: 1 | 2 | 3;
  accuracy: number;
  avatarUrl: string | null;
  userAvatarFrame?: number;
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
}

export interface FirebaseLogsMarketplaceInterface {
  type: "marketplace_listing";
  uid: string;
  userName: string;
  avatarUrl: string | null;
  userAvatarFrame?: number;
  timestamp: string | number | Date;
  data: string;
  itemType: "guitar" | "effect";
  itemName: string;
  itemBrand: string;
  itemRarity: string;
  itemImageId: number | string;
  price: number;
  /** Full rolled instance — drives the card tooltip + level. */
  rolledItem?: InventoryItem | EffectInventoryItem;
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
}

export interface FirebaseLogsMarketplacePurchaseInterface {
  type: "marketplace_purchase";
  /** Buyer — the log belongs to them, so they're the one who can't motivate it. */
  uid: string;
  userName: string;
  avatarUrl: string | null;
  userAvatarFrame?: number;
  timestamp: string | number | Date;
  data: string;
  sellerId: string;
  sellerName: string;
  itemType: "guitar" | "effect";
  itemName: string;
  itemBrand: string;
  itemRarity: string;
  itemImageId: number | string;
  price: number;
  /** Full transferred instance — drives the card tooltip + level. */
  rolledItem?: InventoryItem | EffectInventoryItem;
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
}

export interface FirebaseLogsSupportAskInterface {
  type: "support_ask_update";
  data: string;
  variant: SupportVariantId;
  raisedThisMonth: number;
  monthlyGoal: number;
  totalRaised: number;
  supporters: number;
  nextTierLabel?: string | null;
  nextTierAmountToGo?: number | null;
  /** Absent on logs written before the roadmap-momentum variant existed. */
  tiersFunded?: number | null;
  tiersTotal?: number | null;
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
  timestamp: string | number | Date;
}

export interface FirebaseLogsDonationInterface {
  type: "donation_received";
  data: string;
  supporterName?: string | null;
  amount: number;
  kind: "one_off" | "recurring";
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
  timestamp: string | number | Date;
}

export interface FirebaseLogsCaseOpenInterface {
  type: "case_open";
  uid: string;
  userName: string;
  avatarUrl: string | null;
  userAvatarFrame?: number;
  timestamp: string | number | Date;
  data: string;
  caseType: string;
  caseName: string;
  itemType: "guitar" | "effect";
  itemName: string;
  itemBrand: string;
  itemRarity: string;
  itemImageId: number | string;
  /** Full rolled instance — drives the proper card tooltip + level. Optional on legacy logs. */
  rolledItem?: InventoryItem | EffectInventoryItem;
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
}