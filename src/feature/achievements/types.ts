import type { TFuncKey } from "i18next";
import type { IconType } from "react-icons/lib";
import type {
  ReportDataInterface,
  ReportFormikInterface
} from "feature/user/view/ReportView/ReportView.types";
import type { SongListInterface } from "src/pages/api/user/report";
import type { StatisticsDataInterface } from "types/api.types";
import type { AchievementsRarityType } from "./data/achievementsRarity";

export type AchievementList =
  | "time_1"
  | "time_2"
  | "time_3"
  | "balance"
  | "fire"
  | "health_habits"
  | "points_1"
  | "points_2"
  | "points_3"
  | "doctor"
  | "tired"
  | "diamond"
  | "scientist"
  | "artist"
  | "book"
  | "bigear"
  | "wizard"
  | "medal"
  | "day_1"
  | "day_2"
  | "day_3"
  | "session_1"
  | "session_2"
  | "session_3"
  | "ring"
  | "headphones"
  | "ninja"
  | "record"
  | "vinyl"
  | "rightway"
  | "yolo"
  | "path"
  | "dumbbel"
  | "vip"
  | "short"
  | "event"
  | "lvl100"
  | "fireSession"
  | "batteryHearth"
  | "100days"
  | "bomb"
  | "wannaLearn1"
  | "wannaLearn2"
  | "wannaLearn3"
  | "wannaLearn10"
  | "wannaLearn30"
  | "learning1"
  | "learning3"
  | "learning5"
  | "learning10"
  | "learning20"
  | "learning30"
  | "learning50"
  | "learned1"
  | "learned3"
  | "learned5"
  | "learned10"
  | "learned20"
  | "learned30"
  | "learned50"
  | "learned100";

export interface AchievementContext {
  statistics: StatisticsDataInterface;
  sessionResults: ReportDataInterface;
  inputData: ReportFormikInterface;
  songLists: SongListInterface;
}

export type AchievementCheck = (ctx: AchievementContext) => boolean;

export interface AchievementProgress {
  current: number;
  max: number;
  unit?: "h" | "pts" | "days" | "sessions" | "songs" | "habits";
}

export interface AchievementsDataInterface extends AchievementsRarityType {
  id: AchievementList;
  name: TFuncKey<"achievements">;
  Icon: IconType;
  description: TFuncKey<"achievements">;
  check: AchievementCheck;
  getProgress?: (ctx: AchievementContext) => AchievementProgress;
}

export type AchievementCheckerReturnType = AchievementList | undefined;
