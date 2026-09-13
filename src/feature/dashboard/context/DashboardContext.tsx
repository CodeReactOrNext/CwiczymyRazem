import type { DateWithReport } from "components/ActivityLog/activityLog.types";
import type { DashboardLayout } from "feature/dashboard/types/dashboard.types";
import type { PracticeStatsWidget } from "feature/profile/components/PracticeStatsWidget";
import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext } from "react";
import type { StatisticsDataInterface } from "types/api.types";

/**
 * Everything Home already has in hand when it renders — the stats from the
 * store and the activity log it loads once for the heatmap. Cards read from
 * here instead of each fetching the same year of reports again.
 */
export interface DashboardDataContextValue {
  userAuth: string;
  userStats: StatisticsDataInterface;
  activity: {
    year: number;
    setYear: (year: number) => void;
    datasWithReports: DateWithReport[];
    isLoading: boolean;
    reportList: ComponentProps<typeof PracticeStatsWidget>["reportList"];
  };
  totalTimeValue: string;
  timeTrendData: number[];
  /** The community feed the page was handed; the default feed is used without it. */
  feedSlot?: ReactNode;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null,
);

export const DashboardDataProvider = DashboardDataContext.Provider;

export const useDashboardData = (): DashboardDataContextValue => {
  const value = useContext(DashboardDataContext);
  if (!value) {
    throw new Error(
      "useDashboardData must be used inside DashboardDataProvider",
    );
  }
  return value;
};

/** The layout being shown, whether it is being customised, and how to change it. */
export interface DashboardLayoutContextValue {
  layout: DashboardLayout;
  isEditing: boolean;
  updateLayout: (layout: DashboardLayout) => void;
}

const DashboardLayoutContext =
  createContext<DashboardLayoutContextValue | null>(null);

export const DashboardLayoutProvider = DashboardLayoutContext.Provider;

export const useDashboardLayoutContext = (): DashboardLayoutContextValue => {
  const value = useContext(DashboardLayoutContext);
  if (!value) {
    throw new Error(
      "useDashboardLayoutContext must be used inside DashboardLayoutProvider",
    );
  }
  return value;
};
