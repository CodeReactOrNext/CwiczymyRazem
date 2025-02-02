import { Card } from "assets/components/ui/card";
import { useTranslation } from "react-i18next";
import { FaBrain, FaClock, FaRegLightbulb, FaTrophy } from "react-icons/fa";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";

interface PracticeInsightsProps {
  statistics: StatisticsDataInterface;
}

function getFocusSuggestion(areas: { name: string; time: number }[]): {
  area: string;
  advice: string;
} {
  const total = areas.reduce((sum, area) => sum + area.time, 0);

  // Calculate percentages and hourly rates
  const areaStats = areas.map((area) => ({
    ...area,
    percentage: total > 0 ? (area.time / total) * 100 : 0,
    hoursSpent: area.time / (1000 * 60 * 60), // Convert to hours
  }));

  // Find significant imbalances
  const maxPercentage = Math.max(...areaStats.map((a) => a.percentage));
  const minPercentage = Math.min(...areaStats.map((a) => a.percentage));
  const percentageGap = maxPercentage - minPercentage;

  // Time-based insights
  const totalHours = total / (1000 * 60 * 60);
  const isNewPlayer = totalHours < 10;
  const isExperienced = totalHours > 100;

  // Distribution analysis
  const hasStrongImbalance = percentageGap > 40; // One area dominates others by 40%
  const isBalanced = percentageGap < 20; // Less than 20% difference between highest and lowest

  // Find most and least practiced areas
  const mostPracticed = areaStats.reduce((prev, curr) =>
    curr.percentage > prev.percentage ? curr : prev
  );
  const leastPracticed = areaStats.reduce((prev, curr) =>
    curr.percentage < prev.percentage ? curr : prev
  );

  // Additional analysis patterns
  const consistencyCheck = {
    highTechnique:
      areaStats.find((a) => a.name === "technique")?.hoursSpent ?? 0 > 30,
    highTheory:
      areaStats.find((a) => a.name === "theory")?.hoursSpent ?? 0 > 20,
    highHearing:
      areaStats.find((a) => a.name === "hearing")?.hoursSpent ?? 0 > 15,
    highCreativity:
      areaStats.find((a) => a.name === "creativity")?.hoursSpent ?? 0 > 15,
  };

  // Check for advanced patterns
  if (isExperienced && isBalanced) {
    const allAreasAdvanced = Object.values(consistencyCheck).every((v) => v);
    if (allAreasAdvanced) {
      return {
        area: "mastery",
        advice: "mastery_level",
      };
    }
  }

  // Check for specific combinations
  if (consistencyCheck.highTechnique && consistencyCheck.highTheory) {
    if (!consistencyCheck.highCreativity) {
      return {
        area: "creativity",
        advice: "apply_knowledge_creatively",
      };
    }
  }

  if (consistencyCheck.highTechnique && !consistencyCheck.highTheory) {
    return {
      area: "theory",
      advice: "technical_to_theoretical",
    };
  }

  // Check for potential specialization paths
  if (mostPracticed.hoursSpent > 40) {
    switch (mostPracticed.name) {
      case "technique":
        return {
          area: "specialization",
          advice: "technical_specialist",
        };
      case "theory":
        return {
          area: "specialization",
          advice: "theory_specialist",
        };
      case "hearing":
        return {
          area: "specialization",
          advice: "hearing_specialist",
        };
      case "creativity":
        return {
          area: "specialization",
          advice: "creativity_specialist",
        };
    }
  }

  // Check for rapid progress patterns
  if (totalHours > 20 && totalHours < 50) {
    if (percentageGap < 30) {
      return {
        area: "progress",
        advice: "rapid_balanced_progress",
      };
    }
  }

  // Generate advice based on actual practice patterns
  if (total === 0) {
    return {
      area: "general",
      advice: "first_steps",
    };
  }

  if (hasStrongImbalance) {
    if (mostPracticed.hoursSpent > 20) {
      // Player is potentially specializing
      return {
        area: leastPracticed.name,
        advice: `complement_${mostPracticed.name}`,
      };
    } else {
      // Early imbalance that should be addressed
      return {
        area: "balance",
        advice: `balance_early_${leastPracticed.name}`,
      };
    }
  }

  if (isBalanced) {
    if (isExperienced) {
      return {
        area: "advanced",
        advice: "increase_complexity",
      };
    }
    if (totalHours < 50) {
      return {
        area: "foundation",
        advice: "build_foundation",
      };
    }
  }

  // Time threshold checks for each area
  const needsTechnicalFoundation =
    areaStats.find((a) => a.name === "technique")?.hoursSpent ?? 0 < 10;
  const needsTheoryBasics =
    areaStats.find((a) => a.name === "theory")?.hoursSpent ?? 0 < 5;

  if (needsTechnicalFoundation) {
    return {
      area: "technique",
      advice: "technical_foundation_needed",
    };
  }

  if (needsTheoryBasics) {
    return {
      area: "theory",
      advice: "theory_basics_needed",
    };
  }

  // Default balanced progression
  return {
    area: "progress",
    advice: "steady_progress",
  };
}

export const PracticeInsights = ({ statistics }: PracticeInsightsProps) => {
  const { t } = useTranslation("profile");
  const { time, points, sessionCount } = statistics;

  // Calculate insights
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;
  const avgSessionLength = sessionCount > 0 ? totalTime / sessionCount : 0;
  const avgPointsPerHour = totalTime > 0 ? (points / totalTime) * 3600000 : 0;

  // Find strongest area
  const areas = [
    { name: "technique", time: time.technique },
    { name: "theory", time: time.theory },
    { name: "hearing", time: time.hearing },
    { name: "creativity", time: time.creativity },
  ];
  const strongestArea = areas.reduce((prev, current) =>
    current.time > prev.time ? current : prev
  );

  const focusSuggestion = getFocusSuggestion(areas);

  const insights = [
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
      value: t(strongestArea.name as any),
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
          <Card key={index} className='p-4'>
            <div className='flex items-start gap-3'>
              <div className='rounded-lg bg-second p-2'>{insight.icon}</div>
              <div>
                <p className='mb-3 text-sm text-muted-foreground'>
                  {insight.label}
                </p>
                <p className='text-md font-semibold'>{insight.value}</p>
                {insight.description && (
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {insight.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
