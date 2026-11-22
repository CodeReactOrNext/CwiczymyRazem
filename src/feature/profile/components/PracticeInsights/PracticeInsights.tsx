import { Card } from "assets/components/ui/card";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { useTranslation } from "hooks/useTranslation";
import { Brain, Clock, Trophy } from "lucide-react";
import { useMemo } from "react";
import { convertMsToHM } from "utils/converter";

import { calculateMetrics } from "./calculateMetrics";
import { InsightCard } from "./InsightCard";
import type { InsightItem, PracticeInsightsProps } from "./types";

export const PracticeInsights = ({ statistics }: PracticeInsightsProps) => {
  const { t } = useTranslation("profile");

  if (!statistics) {
    return (
      <Card className='p-5 sm:p-6'>
        <SectionHeader
          as='h3'
          title={t("practice_insights")}
          className='mb-2'
        />
        <p className='text-sm text-zinc-400'>
          {t("insights.advice.first_steps")}
        </p>
      </Card>
    );
  }

  const { time, points, sessionCount } = statistics;

  const { avgSessionLength, avgPointsPerHour, strongestArea } =
    useMemo(
      () => calculateMetrics(time, points, sessionCount),
      [time, points, sessionCount]
    );

  const insights: InsightItem[] = [
    {
      icon: <Clock className='h-5 w-5' />,
      label: t("insights.avg_session"),
      value: convertMsToHM(avgSessionLength),
      description: t("insights.avg_session_desc"),
    },
    {
      icon: <Trophy className='h-5 w-5' />,
      label: t("insights.points_per_hour"),
      value: Math.round(avgPointsPerHour),
      description: t("insights.points_per_hour_desc"),
    },
    {
      icon: <Brain className='h-5 w-5' />,
      label: t("insights.strongest_area"),
      value: t(`${strongestArea.name}` as any),
      description: t("insights.strongest_area_desc"),
    },
  ];

  return (
    <div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
    </div>
  );
};
