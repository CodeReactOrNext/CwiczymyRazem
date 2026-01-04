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
import { AchievementRequirement } from "feature/achievements/utils/AchievementRequirement";
import { AchievementList } from "../../types";
import { achivFactor } from "../achievementsData.utils";

export const timeAchievements = [
  achivFactor("time_1", FaThumbsUp, "common", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(10))),
  achivFactor("book", FaBook, "common", AchievementRequirement.statTimeThreshold("theory", hoursToMilliseconds(10))),
  achivFactor("headphones", FaHeadphones, "common", AchievementRequirement.statTimeThreshold("hearing", hoursToMilliseconds(10))),
  achivFactor("ninja", FaUserNinja, "common", AchievementRequirement.statTimeThreshold("technique", hoursToMilliseconds(10))),
  achivFactor("artist", FaPalette, "common", AchievementRequirement.statTimeThreshold("creativity", hoursToMilliseconds(10))),
  achivFactor("time_2", FaClock, "rare", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(30))),
  achivFactor("time_3", FaHourglass, "veryRare", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(100))),
  achivFactor("scientist", FaMicroscope, "veryRare", AchievementRequirement.statTimeThreshold("theory", hoursToMilliseconds(100))),
  achivFactor("bigear", FaHeadphones, "veryRare", AchievementRequirement.statTimeThreshold("hearing", hoursToMilliseconds(100))), // Headphones icon
  achivFactor("wizard", FaUserNinja, "veryRare", AchievementRequirement.statTimeThreshold("technique", hoursToMilliseconds(100))), // Ninja icon
  achivFactor("fireSession", GiCelebrationFire, "epic", (ctx) => {
    const { time } = ctx.statistics;
    return (time.technique + time.theory + time.hearing + time.creativity) >= hoursToMilliseconds(10);
  }),
  achivFactor("100days", GiExtraTime, "epic", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(24 * 100))),
];
