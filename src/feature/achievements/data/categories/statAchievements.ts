import {
  FaCat,
  FaChartLine,
  FaCalendarWeek,
  FaMouse,
  FaHiking,
  FaKiwiBird,
  FaFrog,
  FaInfinity,
  FaHatCowboy,
} from "react-icons/fa";
import { TbGuitarPick } from "react-icons/tb";
import { AchievementRequirement } from "feature/achievements/utils/AchievementRequirement";
import { AchievementList } from "../../types";
import { achivFactor } from "feature/achievements/data/achievementsData.utils";

export const statAchievements = [
  achivFactor("points_1", FaCat, "common", AchievementRequirement.statThreshold("points", 100)),
  achivFactor("day_1", FaChartLine, "common", AchievementRequirement.statThreshold("dayWithoutBreak", 1)),
  achivFactor("day_2", FaCalendarWeek, "common", AchievementRequirement.statThreshold("dayWithoutBreak", 7)),
  achivFactor("session_1", FaMouse, "common", AchievementRequirement.statThreshold("sessionCount", 10)),
  achivFactor("diamond", TbGuitarPick, "rare", AchievementRequirement.statThreshold("maxPoints", 100)), // Icon needs to be consistent
  achivFactor("session_2", FaHiking, "rare", AchievementRequirement.statThreshold("sessionCount", 100)),
  achivFactor("points_2", FaKiwiBird, "rare", AchievementRequirement.statThreshold("points", 1000)),
  achivFactor("points_3", FaFrog, "veryRare", AchievementRequirement.statThreshold("points", 10000)),
  achivFactor("day_3", FaInfinity, "veryRare", AchievementRequirement.statThreshold("dayWithoutBreak", 30)),
  achivFactor("session_3", FaHatCowboy, "veryRare", AchievementRequirement.statThreshold("sessionCount", 1000)),
  achivFactor("lvl100", TbGuitarPick, "epic", AchievementRequirement.statThreshold("lvl", 100)),
];
