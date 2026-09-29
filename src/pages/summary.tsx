import { SummaryView } from "feature/aiSummary/view/SummaryView";
import { LevelGate } from "feature/levelGate/components/LevelGate";
import { PremiumFeaturePreview } from "feature/premium/components/PremiumFeaturePreview";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { selectUserInfo } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout/AppLayout";
import { BarChart3, Target, TrendingUp, Zap } from "lucide-react";
import type { ReactElement } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

/** Milestones: your own weekly targets, behind the Master plan. */
const SummaryPage: NextPageWithLayout = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const isMaster = userInfo?.role === "master" || userInfo?.role === "admin";

  const milestones =
    !isMaster && userInfo !== null ? (
      <div className='min-h-screen bg-zinc-950'>
        <PremiumFeaturePreview
          eyebrow='Session'
          title='Summary'
          description='Get AI-powered insights into every practice session. See detailed breakdowns of your performance, track progress over time, and identify areas for improvement with personalized recommendations.'
          features={[
            {
              icon: <BarChart3 className='h-5 w-5' />,
              label: "Session Analytics",
              description:
                "Detailed metrics and insights from every practice session",
            },
            {
              icon: <TrendingUp className='h-5 w-5' />,
              label: "Progress Tracking",
              description:
                "Monitor your improvement and streaks over days and weeks",
            },
            {
              icon: <Target className='h-5 w-5' />,
              label: "Goal Insights",
              description: "AI recommendations based on your practice goals",
            },
            {
              icon: <Zap className='h-5 w-5' />,
              label: "Performance Breakdown",
              description: "Understand what's working and where to focus next",
            },
          ]}
          previewImagePath='/images/premium/summary.png'
          previewImageAlt='Summary - Practice session insights preview'
          availableIn='master'
        />
      </div>
    ) : (
      <div className='flex min-h-screen flex-col overflow-visible rounded-lg border-none bg-second-600 shadow-sm'>
        <PremiumGate feature='summary' requiredPlan='master'>
          <SummaryView />
        </PremiumGate>
      </div>
    );

  // Milestones are read out of your own practice history, so the page waits for
  // one behind the level gate.
  return (
    <LevelGate feature='summary' className='min-h-screen bg-zinc-950'>
      {milestones}
    </LevelGate>
  );
};

SummaryPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='summary' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default SummaryPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
    "common",
    "profile",
    "footer",
    "achievements",
    "toast",
    "skills",
    "songs",
    "my_plans",
    "exercises",
  ],
});
