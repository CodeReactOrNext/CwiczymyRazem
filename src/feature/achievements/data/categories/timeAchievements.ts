import {
  FaThumbsUp,
  FaBook,
  FaHeadphones,
  FaUserNinja,
  FaPalette,
  FaClock,
  FaHourglass,
  FaMicroscope,
} from "react-icons/fa";
import { GiCelebrationFire, GiExtraTime } from "react-icons/gi";
import { hoursToMilliseconds } from "date-fns";
import { inputTimeConverter } from "utils/converter";
import { AchievementRequirement } from "feature/achievements/utils/AchievementRequirement";
import { achivFactor } from "../achievementsData.utils";

export const timeAchievements = [
  achivFactor("time_1", FaThumbsUp, "common", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(10)), AchievementRequirement.getProgressFor.totalTimeThreshold(hoursToMilliseconds(10))),
  achivFactor("book", FaBook, "common", AchievementRequirement.statTimeThreshold("theory", hoursToMilliseconds(10)), AchievementRequirement.getProgressFor.statTimeThreshold("theory", hoursToMilliseconds(10))),
  achivFactor("headphones", FaHeadphones, "common", AchievementRequirement.statTimeThreshold("hearing", hoursToMilliseconds(10)), AchievementRequirement.getProgressFor.statTimeThreshold("hearing", hoursToMilliseconds(10))),
  achivFactor("ninja", FaUserNinja, "common", AchievementRequirement.statTimeThreshold("technique", hoursToMilliseconds(10)), AchievementRequirement.getProgressFor.statTimeThreshold("technique", hoursToMilliseconds(10))),
  achivFactor("artist", FaPalette, "common", AchievementRequirement.statTimeThreshold("creativity", hoursToMilliseconds(10)), AchievementRequirement.getProgressFor.statTimeThreshold("creativity", hoursToMilliseconds(10))),
  achivFactor("time_2", FaClock, "rare", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(30)), AchievementRequirement.getProgressFor.totalTimeThreshold(hoursToMilliseconds(30))),
  achivFactor("time_3", FaHourglass, "veryRare", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(100)), AchievementRequirement.getProgressFor.totalTimeThreshold(hoursToMilliseconds(100))),
  achivFactor("scientist", FaMicroscope, "veryRare", AchievementRequirement.statTimeThreshold("theory", hoursToMilliseconds(50)), AchievementRequirement.getProgressFor.statTimeThreshold("theory", hoursToMilliseconds(50))),
  achivFactor("bigear", FaHeadphones, "veryRare", AchievementRequirement.statTimeThreshold("hearing", hoursToMilliseconds(50)), AchievementRequirement.getProgressFor.statTimeThreshold("hearing", hoursToMilliseconds(50))),
  achivFactor("wizard", FaUserNinja, "veryRare", AchievementRequirement.statTimeThreshold("technique", hoursToMilliseconds(50)), AchievementRequirement.getProgressFor.statTimeThreshold("technique", hoursToMilliseconds(50))),
  achivFactor("fireSession", GiCelebrationFire, "epic", (ctx) => {
    return inputTimeConverter(ctx.inputData).sumTime >= hoursToMilliseconds(10);
  }),
  achivFactor("100days", GiExtraTime, "epic", AchievementRequirement.statThreshold("dayWithoutBreak", 100), AchievementRequirement.getProgressFor.statThreshold("dayWithoutBreak", 100, "days")),
];
