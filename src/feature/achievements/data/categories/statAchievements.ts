import { achivFactor } from "feature/achievements/data/achievementsData.utils";
import { AchievementRequirement } from "feature/achievements/utils/AchievementRequirement";
import {
  FaCalendarWeek,
  FaCat,
  FaChartLine,
  FaFrog,
  FaHatCowboy,
  FaHiking,
  FaInfinity,
  FaKiwiBird,
  FaMouse,
} from "react-icons/fa";
import { TbGuitarPick } from "react-icons/tb";


export const statAchievements = [
  achivFactor("points_1", FaCat, "common", AchievementRequirement.statThreshold("points", 100), AchievementRequirement.getProgressFor.statThreshold("points", 100, "pts")),
  achivFactor("day_1", FaChartLine, "common", AchievementRequirement.statThreshold("actualDayWithoutBreak", 3), AchievementRequirement.getProgressFor.statThreshold("actualDayWithoutBreak", 3, "days")),
  achivFactor("day_2", FaCalendarWeek, "common", AchievementRequirement.statThreshold("actualDayWithoutBreak", 7), AchievementRequirement.getProgressFor.statThreshold("actualDayWithoutBreak", 7, "days")),
  achivFactor("session_1", FaMouse, "common", AchievementRequirement.statThreshold("sessionCount", 20), AchievementRequirement.getProgressFor.statThreshold("sessionCount", 20, "sessions")),
  achivFactor("diamond", TbGuitarPick, "rare", AchievementRequirement.statThreshold("lvl", 28), AchievementRequirement.getProgressFor.statThreshold("lvl", 28)),
  achivFactor("session_2", FaHiking, "rare", AchievementRequirement.statThreshold("sessionCount", 50), AchievementRequirement.getProgressFor.statThreshold("sessionCount", 50, "sessions")),
  achivFactor("points_2", FaKiwiBird, "rare", AchievementRequirement.statThreshold("points", 1000), AchievementRequirement.getProgressFor.statThreshold("points", 1000, "pts")),
  achivFactor("points_3", FaFrog, "veryRare", AchievementRequirement.statThreshold("points", 10000), AchievementRequirement.getProgressFor.statThreshold("points", 10000, "pts")),
  achivFactor("day_3", FaInfinity, "veryRare", AchievementRequirement.statThreshold("actualDayWithoutBreak", 15), AchievementRequirement.getProgressFor.statThreshold("actualDayWithoutBreak", 15, "days")),
  achivFactor("session_3", FaHatCowboy, "veryRare", AchievementRequirement.statThreshold("sessionCount", 100), AchievementRequirement.getProgressFor.statThreshold("sessionCount", 100, "sessions")),
  achivFactor("lvl100", TbGuitarPick, "epic", AchievementRequirement.statThreshold("lvl", 100), AchievementRequirement.getProgressFor.statThreshold("lvl", 100, "pts")),
];
