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
  achivFactor("points_1", FaCat, "common", AchievementRequirement.statThreshold("points", 100), AchievementRequirement.getProgressFor.statThreshold("points", 100)),
  achivFactor("day_1", FaChartLine, "common", AchievementRequirement.statThreshold("actualDayWithoutBreak", 3), AchievementRequirement.getProgressFor.statThreshold("actualDayWithoutBreak", 3)),
  achivFactor("day_2", FaCalendarWeek, "common", AchievementRequirement.statThreshold("actualDayWithoutBreak", 7), AchievementRequirement.getProgressFor.statThreshold("actualDayWithoutBreak", 7)),
  achivFactor("session_1", FaMouse, "common", AchievementRequirement.statThreshold("sessionCount", 20), AchievementRequirement.getProgressFor.statThreshold("sessionCount", 20)),
  achivFactor("diamond", TbGuitarPick, "rare", AchievementRequirement.statThreshold("maxPoints", 100), AchievementRequirement.getProgressFor.statThreshold("maxPoints", 100)),
  achivFactor("session_2", FaHiking, "rare", AchievementRequirement.statThreshold("sessionCount", 50), AchievementRequirement.getProgressFor.statThreshold("sessionCount", 50)),
  achivFactor("points_2", FaKiwiBird, "rare", AchievementRequirement.statThreshold("points", 1000), AchievementRequirement.getProgressFor.statThreshold("points", 1000)),
  achivFactor("points_3", FaFrog, "veryRare", AchievementRequirement.statThreshold("points", 10000), AchievementRequirement.getProgressFor.statThreshold("points", 10000)),
  achivFactor("day_3", FaInfinity, "veryRare", AchievementRequirement.statThreshold("actualDayWithoutBreak", 15), AchievementRequirement.getProgressFor.statThreshold("actualDayWithoutBreak", 15)),
  achivFactor("session_3", FaHatCowboy, "veryRare", AchievementRequirement.statThreshold("sessionCount", 100), AchievementRequirement.getProgressFor.statThreshold("sessionCount", 100)),
  achivFactor("lvl100", TbGuitarPick, "epic", AchievementRequirement.statThreshold("lvl", 100), AchievementRequirement.getProgressFor.statThreshold("lvl", 100)),
];
