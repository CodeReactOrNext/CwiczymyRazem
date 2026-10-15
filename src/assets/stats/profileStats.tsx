import { achievementsData } from "feature/achievements/data/achievementsData";
import {
  CalendarDays,
  Clock,
  Dumbbell,
  Gem,
  Guitar,
  Heart,
  Medal,
  StarHalf,
} from "lucide-react";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";
import { i18n } from "utils/translation";

const PointsIcon = ({ className }: { className?: string }) => (
  <img src="/images/points.png" alt="points" className={className} />
);

export const getUserStatsField = (userStats: StatisticsDataInterface) => {
  const {
    points,
    sessionCount,
    habitsCount,
    achievements,
    time,
    dayWithoutBreak,
    maxPoints,
    fame,
  } = userStats;

  return [
    {
      id: "fame",
      Icon: Gem,
      description: "Fame",
      value: fame || 0,
    },
    {
      id: "total-time",
      Icon: Clock,
      description: i18n?.t("profile:stats.spent_time"),
      value: convertMsToHM(
        time.technique + time.theory + time.creativity + time.hearing
      ),
    },
    {
      id: "longest-session",
      Icon: Dumbbell,
      description: i18n?.t("profile:stats.longest_session"),
      value: convertMsToHM(time.longestSession),
    },
    {
      id: "consecutive-days",
      Icon: CalendarDays,
      description: i18n?.t("profile:stats.consecutive days"),
      value: dayWithoutBreak,
    },
    {
      id: "session-count",
      Icon: Guitar,
      description: i18n?.t("profile:stats.num_sessions"),
      value: sessionCount,
    },
    {
      id: "points",
      Icon: PointsIcon,
      description: i18n?.t("profile:stats.num_points"),
      value: points,
    },
    {
      id: "max-points",
      Icon: StarHalf,
      description: i18n?.t("profile:stats.max_points"),
      value: maxPoints,
    },
    {
      id: "habits-count",
      Icon: Heart,
      description: i18n?.t("profile:stats.num_habbits"),
      value: habitsCount,
    },
    {
      id: "achievements-count",
      Icon: Medal,
      description: i18n?.t("profile:stats.num_achievements"),
      value: achievements.length + "/" + achievementsData.length,
    },
  ];
};
