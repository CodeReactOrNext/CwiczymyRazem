import { CustomTypeOptions, TFuncKey } from "i18next";

import {
  FaHotjar,
  FaThumbsUp,
  FaClock,
  FaHourglass,
  FaBalanceScale,
  FaHeart,
} from "react-icons/fa";
import { IconType } from "react-icons/lib";
import { AchievementsRarityType } from "./achievementsRarity";

export type AchievementList =
  | "time_1"
  | "time_2"
  | "time_3"
  | "balance"
  | "fire"
  | "health_habits";

export interface AchievementsDataInterface extends AchievementsRarityType {
  id: AchievementList;
  name: TFuncKey<"achievements">;
  Icon: IconType;
  description: TFuncKey<"achievements">;
}

export const achievementsData: AchievementsDataInterface[] = [
  {
    id: "time_1",
    name: "time_1.title",
    Icon: FaThumbsUp,
    rarity: "common",
    description: "time_1.description",
  },
  {
    id: "time_2",
    name: "time_2.title",
    Icon: FaClock,
    rarity: "rare",
    description: "time_2.description",
  },
  {
    id: "time_3",
    name: "time_3.title",
    Icon: FaHourglass,
    rarity: "veryRare",
    description: "time_3.description",
  },
  {
    id: "balance",
    name: "balance.title",
    Icon: FaBalanceScale,
    rarity: "rare",
    description: "balance.description",
  },
  {
    id: "fire",
    name: "fire.title",
    Icon: FaHotjar,
    rarity: "veryRare",
    description: "fire.description",
  },
  {
    id: "health_habits",
    name: "health_habits.title",
    Icon: FaHeart,
    rarity: "common",
    description: "health_habits.description",
  },
];
