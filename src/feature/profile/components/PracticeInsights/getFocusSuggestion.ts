import type { FocusSuggestion, PracticeArea } from "./types";

export function getFocusSuggestion(areas: PracticeArea[]): FocusSuggestion {
  const total = areas.reduce((sum, area) => sum + area.time, 0);

  const areaStats = areas.map((area) => ({
    ...area,
    percentage: total > 0 ? (area.time / total) * 100 : 0,
    hoursSpent: area.time / (1000 * 60 * 60),
  }));

  const maxPercentage = Math.max(...areaStats.map((a) => a.percentage || 0));
  const minPercentage = Math.min(...areaStats.map((a) => a.percentage || 0));
  const percentageGap = maxPercentage - minPercentage;

  const totalHours = total / (1000 * 60 * 60);
  const isExperienced = totalHours > 100;

  const hasStrongImbalance = percentageGap > 40;
  const isBalanced = percentageGap < 20;

  const mostPracticed = areaStats.reduce((prev, curr) =>
    (curr.percentage || 0) > (prev.percentage || 0) ? curr : prev
  );
  const leastPracticed = areaStats.reduce((prev, curr) =>
    (curr.percentage || 0) < (prev.percentage || 0) ? curr : prev
  );

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

  if (isExperienced && isBalanced) {
    const allAreasAdvanced = Object.values(consistencyCheck).every((v) => v);
    if (allAreasAdvanced) {
      return {
        area: "mastery",
        advice: "mastery_level",
      };
    }
  }

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

  if (mostPracticed.hoursSpent && mostPracticed.hoursSpent > 40) {
    return {
      area: "specialization",
      advice: `${mostPracticed.name}_specialist`,
    };
  }

  if (totalHours > 20 && totalHours < 50) {
    if (percentageGap < 30) {
      return {
        area: "progress",
        advice: "rapid_balanced_progress",
      };
    }
  }

  if (total === 0) {
    return {
      area: "general",
      advice: "first_steps",
    };
  }

  if (hasStrongImbalance) {
    if (mostPracticed.hoursSpent && mostPracticed.hoursSpent > 20) {
      return {
        area: leastPracticed.name,
        advice: `complement_${mostPracticed.name}`,
      };
    } else {
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

  return {
    area: "progress",
    advice: "steady_progress",
  };
} 