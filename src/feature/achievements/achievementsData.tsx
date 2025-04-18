import type { TFuncKey } from "i18next";
import {
  FaBalanceScale,
  FaBook,
  FaCalendarWeek,
  FaCat,
  FaChartLine,
  FaClock,
  FaDumbbell,
  FaEvernote,
  FaFrog,
  FaGrimace,
  FaGuitar,
  FaHandSparkles,
  FaHatCowboy,
  FaHatWizard,
  FaHeadphones,
  FaHeart,
  FaHiking,
  FaHotjar,
  FaHourglass,
  FaInfinity,
  FaKiwiBird,
  FaMedal,
  FaMicrophoneAlt,
  FaMicroscope,
  FaMouse,
  FaPalette,
  FaRecordVinyl,
  FaRing,
  FaRoute,
  FaShieldAlt,
  FaThumbsUp,
  FaTired,
  FaTrophy,
  FaUserMd,
  FaUserNinja,
  FaWrench,
} from "react-icons/fa";
import { GiCelebrationFire } from "react-icons/gi";
import { GiHeartBattery } from "react-icons/gi";
import { GiExtraTime } from "react-icons/gi";
import type { IconType } from "react-icons/lib";
import { TbGuitarPick } from "react-icons/tb";

import type { AchievementsRarityType } from "./achievementsRarity";

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
  | "100days";
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
    id: "points_1",

    name: "points_1.title",
    Icon: FaCat,
    rarity: "common",
    description: "points_1.description",
  },
  {
    id: "day_1",
    name: "day_1.title",
    Icon: FaChartLine,
    rarity: "common",
    description: "day_1.description",
  },
  {
    id: "day_2",
    name: "day_2.title",
    Icon: FaCalendarWeek,
    rarity: "common",
    description: "day_2.description",
  },
  {
    id: "health_habits",
    name: "health_habits.title",
    Icon: FaHeart,
    rarity: "common",
    description: "health_habits.description",
  },
  {
    id: "book",
    name: "book.title",
    Icon: FaBook,
    rarity: "common",
    description: "book.description",
  },
  {
    id: "ring",
    name: "ring.title",
    Icon: FaRing,
    rarity: "common",
    description: "ring.description",
  },
  {
    id: "headphones",
    name: "headphones.title",
    Icon: FaHeadphones,
    rarity: "common",
    description: "headphones.description",
  },
  {
    id: "session_1",
    name: "session_1.title",
    Icon: FaMouse,
    rarity: "common",
    description: "session_1.description",
  },

  {
    id: "ninja",
    name: "ninja.title",
    Icon: FaUserNinja,
    rarity: "common",
    description: "ninja.description",
  },
  {
    id: "artist",
    name: "artist.title",
    Icon: FaPalette,
    rarity: "common",
    description: "artist.description",
  },
  {
    id: "balance",
    name: "balance.title",
    Icon: FaBalanceScale,
    rarity: "rare",
    description: "balance.description",
  },
  {
    id: "doctor",
    name: "doctor.title",
    Icon: FaUserMd,
    rarity: "rare",
    description: "doctor.description",
  },
  {
    id: "record",
    name: "record.title",
    Icon: FaMicrophoneAlt,
    rarity: "rare",
    description: "record.description",
  },
  {
    id: "vinyl",
    name: "vinyl.title",
    Icon: FaRecordVinyl,
    rarity: "rare",
    description: "vinyl.description",
  },
  {
    id: "rightway",
    name: "rightway.title",
    Icon: FaHandSparkles,
    rarity: "rare",
    description: "rightway.description",
  },
  {
    id: "yolo",
    name: "yolo.title",
    Icon: FaGrimace,
    rarity: "rare",
    description: "yolo.description",
  },
  {
    id: "path",
    name: "path.title",
    Icon: FaRoute,
    rarity: "rare",
    description: "path.description",
  },
  {
    id: "diamond",
    name: "diamond.title",
    Icon: FaGuitar,
    rarity: "rare",
    description: "diamond.description",
  },
  {
    id: "time_2",
    name: "time_2.title",
    Icon: FaClock,
    rarity: "rare",
    description: "time_2.description",
  },
  {
    id: "session_2",
    name: "session_2.title",
    Icon: FaHiking,
    rarity: "rare",
    description: "session_2.description",
  },
  {
    id: "points_2",
    name: "points_2.title",
    Icon: FaKiwiBird,
    rarity: "rare",
    description: "points_2.description",
  },
  {
    id: "tired",
    name: "tired.title",
    Icon: FaTired,
    rarity: "rare",
    description: "tired.description",
  },
  {
    id: "time_3",
    name: "time_3.title",
    Icon: FaHourglass,
    rarity: "veryRare",
    description: "time_3.description",
  },

  {
    id: "fire",
    name: "fire.title",
    Icon: FaHotjar,
    rarity: "veryRare",
    description: "fire.description",
  },

  {
    id: "points_3",
    name: "points_3.title",
    Icon: FaFrog,
    rarity: "veryRare",
    description: "points_3.description",
  },

  {
    id: "scientist",
    name: "scientist.title",
    Icon: FaMicroscope,
    rarity: "veryRare",
    description: "scientist.description",
  },

  {
    id: "bigear",
    name: "bigear.title",
    Icon: FaEvernote,
    rarity: "veryRare",
    description: "bigear.description",
  },
  {
    id: "wizard",
    name: "wizard.title",
    Icon: FaHatWizard,
    rarity: "veryRare",
    description: "wizard.description",
  },
  {
    id: "medal",
    name: "medal.title",
    Icon: FaMedal,
    rarity: "veryRare",
    description: "medal.description",
  },

  {
    id: "day_3",
    name: "day_3.title",
    Icon: FaInfinity,
    rarity: "veryRare",
    description: "day_3.description",
  },

  {
    id: "session_3",
    name: "session_3.title",
    Icon: FaHatCowboy,
    rarity: "veryRare",
    description: "session_3.description",
  },

  {
    id: "dumbbel",
    name: "dumbbel.title",
    Icon: FaDumbbell,
    rarity: "veryRare",
    description: "dumbbel.description",
  },
  {
    id: "vip",
    name: "vip.title",
    Icon: FaWrench,
    rarity: "veryRare",
    description: "vip.description",
  },
  {
    id: "short",
    name: "short.title",
    Icon: FaShieldAlt,
    rarity: "veryRare",
    description: "short.description",
  },
  {
    id: "event",
    name: "event.title",
    Icon: FaTrophy,
    rarity: "veryRare",
    description: "event.description",
  },
  {
    id: "lvl100",
    name: "lvl100.title",
    Icon: TbGuitarPick,
    rarity: "epic",
    description: "lvl100.description",
  },
  {
    id: "fireSession",
    name: "fireSession.title",
    Icon: GiCelebrationFire,
    rarity: "epic",
    description: "fireSession.description",
  },
  {
    id: "batteryHearth",
    name: "batteryHearth.title",
    Icon: GiHeartBattery,
    rarity: "epic",
    description: "batteryHearth.description",
  },
  {
    id: "100days",
    name: "100days.title",
    Icon: GiExtraTime,
    rarity: "epic",
    description: "100days.description",
  },
];
