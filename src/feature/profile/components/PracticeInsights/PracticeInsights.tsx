import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";
import { FaBrain, FaClock, FaRegLightbulb, FaTrophy } from "react-icons/fa";
import { convertMsToHM } from "utils/converter";

import { calculateMetrics } from "./calculateMetrics";
import { InsightCard } from "./InsightCard";
import type { InsightItem, PracticeInsightsProps } from "./types";

export const PracticeInsights = ({ statistics }: PracticeInsightsProps) => {
  const { t } = useTranslation("profile");

  if (!statistics) {
    return (
      <div className='rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-sm'>
        <h3 className='mb-2 text-xl font-bold text-white'>
          {t("practice_insights")}
        </h3>
        <p className='text-sm text-zinc-400'>
          {t("insights.advice.first_steps")}
        </p>
      </div>
    );
  }

  const { time, points, sessionCount } = statistics;

  const { avgSessionLength, avgPointsPerHour, strongestArea, focusSuggestion } =
    useMemo(
      () => calculateMetrics(time, points, sessionCount),
      [time, points, sessionCount]
    );

  const insights: InsightItem[] = [
    {
      icon: <FaClock className='h-5 w-5' />,
      label: t("insights.avg_session"),
      value: convertMsToHM(avgSessionLength),
      description: t("insights.avg_session_desc"),
    },
    {
      icon: <FaTrophy className='h-5 w-5' />,
      label: t("insights.points_per_hour"),
      value: Math.round(avgPointsPerHour),
      description: t("insights.points_per_hour_desc"),
    },
    {
      icon: <FaBrain className='h-5 w-5' />,
      label: t("insights.strongest_area"),
      value: t(`${strongestArea.name}` as any),
      description: t("insights.strongest_area_desc"),
    },
    {
      icon: <FaRegLightbulb className='h-5 w-5' />,
      label: t("insights.focus_suggestion"),
      value: t(`insights.advice.${focusSuggestion.advice}` as any),
    },
  ];

  return (
    <div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
    </div>
  );
};
