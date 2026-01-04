import { achievementsData } from "feature/achievements/data/achievementsData";
import { i18n } from "next-i18next";
import {
  FaCalendarDay,
  FaClock,
  FaDumbbell,
  FaGuitar,
  FaHeart,
  FaMedal,
  FaStar,
  FaStarHalf,
} from "react-icons/fa";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";

export const getUserStatsField = (userStats: StatisticsDataInterface) => {
  const {
    points,
    sessionCount,
    habitsCount,
    achievements,
    time,
    dayWithoutBreak,
    maxPoints,
  } = userStats;

  return [
    {
      id: "total-time",
      Icon: FaClock,
      description: i18n?.t("profile:stats.spent_time"),
      value: convertMsToHM(
        time.technique + time.theory + time.creativity + time.hearing
      ),
    },
    {
      id: "longest-session",
      Icon: FaDumbbell,
      description: i18n?.t("profile:stats.longest_session"),
      value: convertMsToHM(time.longestSession),
    },
    {
      id: "consecutive-days",
      Icon: FaCalendarDay,
      description: i18n?.t("profile:stats.consecutive days"),
      value: dayWithoutBreak,
    },
    {
      id: "session-count",
      Icon: FaGuitar,
      description: i18n?.t("profile:stats.num_sessions"),
      value: sessionCount,
    },
    {
      id: "points",
      Icon: FaStar,
      description: i18n?.t("profile:stats.num_points"),
      value: points,
    },
    {
      id: "max-points",
      Icon: FaStarHalf,
      description: i18n?.t("profile:stats.max_points"),
      value: maxPoints,
    },
    {
      id: "habits-count",
      Icon: FaHeart,
      description: i18n?.t("profile:stats.num_habbits"),
      value: habitsCount,
    },
    {
      id: "achievements-count",
      Icon: FaMedal,
      description: i18n?.t("profile:stats.num_achievements"),
      value: achievements.length + "/" + achievementsData.length,
    },
  ];
};
