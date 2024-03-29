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

import { StatsFieldProps } from "layouts/ProfileLayout/components/StatsField";

import { convertMsToHM } from "utils/converter";
import { StatisticsDataInterface } from "types/api.types";
import { achievementsData } from "assets/achievements/achievementsData";

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
      Icon: FaClock,
      description: i18n?.t("profile:stats.spent_time"),
      value: convertMsToHM(
        time.technique + time.theory + time.creativity + time.hearing
      ),
    },
    {
      Icon: FaDumbbell,
      description: i18n?.t("profile:stats.longest_session"),
      value: convertMsToHM(time.longestSession),
    },
    {
      Icon: FaCalendarDay,
      description: i18n?.t("profile:stats.consecutive days"),
      value: dayWithoutBreak,
    },
    {
      Icon: FaGuitar,
      description: i18n?.t("profile:stats.num_sessions"),
      value: sessionCount,
    },
    {
      Icon: FaStar,
      description: i18n?.t("profile:stats.num_points"),
      value: points,
    },
    {
      Icon: FaStarHalf,
      description: i18n?.t("profile:stats.max_points"),
      value: maxPoints,
    },
    {
      Icon: FaHeart,
      description: i18n?.t("profile:stats.num_habbits"),
      value: habitsCount,
    },
    {
      Icon: FaMedal,
      description: i18n?.t("profile:stats.num_achievements"),
      value: achievements.length + "/" + achievementsData.length,
    },
  ] as StatsFieldProps[];
};
