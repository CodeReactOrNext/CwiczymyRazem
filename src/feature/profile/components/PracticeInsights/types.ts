import type { StatisticsDataInterface } from "types/api.types";

export interface PracticeInsightsProps {
  statistics: StatisticsDataInterface | null;
  userAuth?: string;
}

export interface PracticeArea {
  name: string;
  time: number;
  percentage?: number;
  hoursSpent?: number;
}

export interface FocusSuggestion {
  area: string;
  advice: string;
}

export interface InsightItem {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
} 