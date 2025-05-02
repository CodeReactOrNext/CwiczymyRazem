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
import { GiCelebrationFire, GiMisdirection, GiMoebiusTriangle, GiMuscularTorso, GiNotebook, GiPush, GiSwordman, GiSwordsPower, GiWeight, GiWeightLiftingUp } from "react-icons/gi";
import { GiHeartBattery } from "react-icons/gi";
import { GiExtraTime } from "react-icons/gi";
import { GiRollingBomb } from "react-icons/gi";
import { GiRearAura } from "react-icons/gi";
import { GiCard2Hearts } from "react-icons/gi";
import { GiCard3Diamonds } from "react-icons/gi";
import { GiCard4Diamonds } from "react-icons/gi";
import { GiCard5Diamonds } from "react-icons/gi";
import { GiCard6Diamonds } from "react-icons/gi";
import { GiCardAceDiamonds } from "react-icons/gi";
import { GiCardKingDiamonds } from "react-icons/gi";
import { GiCardJackDiamonds } from "react-icons/gi";
import { GiMultipleTargets } from "react-icons/gi";
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
  {
    id: "bomb",
    name: "bomb.title",
    Icon: GiRollingBomb,
    rarity: "veryRare",
    description: "bomb.description",
  },

  {
    id: "wannaLearn1",
    name: "wannaLearn1.title",
    Icon: GiSwordman ,
    rarity: "common",
    description: "wannaLearn1.description",
  },
  {
    id: "wannaLearn2",
    name: "wannaLearn2.title",
    Icon: GiSwordsPower ,
    rarity: "common",
    description: "wannaLearn2.description",
  },
  {
    id: "wannaLearn3",
    name: "wannaLearn3.title",
    Icon: GiNotebook ,
    rarity: "common",
    description: "wannaLearn3.description",
  },
  {
    id: "wannaLearn10",
    name: "wannaLearn10.title",
    Icon: GiMisdirection ,
    rarity: "rare",
    description: "wannaLearn10.description",
  },
  {
    id: "wannaLearn30",
    name: "wannaLearn30.title",
    Icon: GiMoebiusTriangle ,
    rarity: "veryRare",
    description: "wannaLearn30.description",
  },
  {
    id: "learning1",
    name: "learning1.title",
    Icon: GiWeight,
    rarity: "common",
    description: "learning1.description",
  },
  {
    id: "learning3",
    name: "learning3.title",
    Icon: GiWeightLiftingUp ,
    rarity: "common",
    description: "learning3.description",
  },
  {
    id: "learning5",
    name: "learning5.title",
    Icon: GiPush ,
    rarity: "common",
    description: "learning5.description",
  },
  {
    id: "learning10",
    name: "learning10.title",
    Icon: GiMuscularTorso,
    rarity: "rare",
    description: "learning10.description",
  },
  {
    id: "learning20",
    name: "learning20.title",
    Icon: GiMultipleTargets,
    rarity: "veryRare",
    description: "learning20.description",
  },
  {
    id: "learning30",
    name: "learning30.title",
    Icon: GiRearAura,
    rarity: "epic",
    description: "learning30.description",
  },
  {
    id: "learned1",
    name: "learned1.title",
    Icon: GiCard2Hearts,
    rarity: "common",
    description: "learned1.description",
  },
  {
    id: "learned3",
    name: "learned3.title",
    Icon: GiCard3Diamonds,
    rarity: "common",
    description: "learned3.description",
  },
  {
    id: "learned5",
    name: "learned5.title",
    Icon: GiCard4Diamonds,
    rarity: "common",
    description: "learned5.description",
  },
  {
    id: "learned10",
    name: "learned10.title",
    Icon: GiCard5Diamonds,
    rarity: "rare",
    description: "learned10.description",
  },
  {
    id: "learned20",
    name: "learned20.title",
    Icon: GiCard6Diamonds,
    rarity: "veryRare",
    description: "learned20.description",
  },
  {
    id: "learned30",
    name: "learned30.title",
    Icon: GiCardJackDiamonds,
    rarity: "veryRare",
    description: "learned30.description",
  },
  {
    id: "learned50",
    name: "learned50.title",
    Icon: GiCardKingDiamonds,
    rarity: "epic",
    description: "learned50.description",
  },
  {
    id: "learned100",
    name: "learned100.title",
    Icon: GiCardAceDiamonds,
    rarity: "epic",
    description: "learned100.description",
  },
];
