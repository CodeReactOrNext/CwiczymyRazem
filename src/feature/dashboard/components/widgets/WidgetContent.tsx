import { ActivityLogView } from "components/ActivityLog/ActivityLog";
import { CommunityGoalCard } from "feature/communityGoal/components/CommunityGoalCard";
import { DailyQuestWidget } from "feature/dashboard/components/DailyQuestWidget";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { isMilestoneWidgetId } from "feature/dashboard/data/milestoneWidgets";
import type { WidgetId } from "feature/dashboard/types/dashboard.types";
import { RecentSessionsWidget } from "feature/practiceLog/components/RecentSessionsWidget";
import { PracticeStatsWidget } from "feature/profile/components/PracticeStatsWidget";
import { NextUpCard } from "feature/progression/components/NextUpCard";

import { MilestoneCard } from "./MilestoneCard";
import { MonthlyChallengeWidget } from "./MonthlyChallengeWidget";
import { RankWidget } from "./RankWidget";
import { ShortcutsWidget } from "./ShortcutsWidget";
import { SongsWidget } from "./SongsWidget";
import { StreakWidget } from "./StreakWidget";

/**
 * The one place a widget id turns into a component. Cards that already
 * existed elsewhere are reused as they are; the shared data (stats, activity
 * log) comes from the dashboard context so nothing is fetched twice.
 */
export const WidgetContent = ({ id }: { id: WidgetId }) => {
  const data = useDashboardData();

  // Tier cards are generated from the milestone table rather than listed one
  // by one, so they are matched before the fixed cards below. Narrowing here
  // also leaves the switch exhaustive over the fixed ids.
  if (isMilestoneWidgetId(id)) return <MilestoneCard widgetId={id} />;

  switch (id) {
    case "daily-quests":
      return <DailyQuestWidget />;
    case "practice-stats":
      return (
        <PracticeStatsWidget
          userStats={data.userStats}
          totalTimeValue={data.totalTimeValue}
          trendData={data.timeTrendData}
          reportList={data.activity.reportList}
          className='h-full'
        />
      );
    case "streak":
      return <StreakWidget />;
    case "shortcuts":
      return <ShortcutsWidget />;
    case "recent-sessions":
      return <RecentSessionsWidget userAuth={data.userAuth} />;
    case "activity-log":
      // The heatmap card carries its own bottom margin from the profile page;
      // the grid gap already separates it here.
      return (
        <div className='[&>*]:mb-0'>
          <ActivityLogView
            year={data.activity.year}
            setYear={data.activity.setYear}
            datasWithReports={data.activity.datasWithReports}
            isLoading={data.activity.isLoading}
          />
        </div>
      );
    case "level-rewards":
      return <NextUpCard />;
    case "songs":
      return <SongsWidget />;
    case "rank":
      return <RankWidget />;
    case "monthly-challenge":
      return <MonthlyChallengeWidget />;
    case "community-goal":
      return <CommunityGoalCard />;
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
};
