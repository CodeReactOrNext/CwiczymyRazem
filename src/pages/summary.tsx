import { cn } from "assets/lib/utils";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { SummaryView } from "feature/aiSummary/view/SummaryView";
import { SupportChallengeExplainer } from "feature/communityGoal/components/SupportChallengeExplainer";
import { PremiumFeaturePreview } from "feature/premium/components/PremiumFeaturePreview";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { LevelGate } from "feature/levelGate/components/LevelGate";
import { selectUserInfo } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout/AppLayout";
import {
  BarChart3,
  Heart,
  Milestone,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

/**
 * Milestones, plus the support challenge running alongside them.
 *
 * The two share a page because they are the same promise — hit a target, claim
 * Fame — and differ in who does the hitting. Milestones are yours and sit
 * behind the Master plan; the challenge is the supporters' and is deliberately
 * not gated, because a page nobody can read is a poor way to explain what a
 * donation buys.
 */

type SummaryTab = "milestones" | "challenge";

const TABS: { id: SummaryTab; label: string; icon: typeof Milestone }[] = [
  { id: "milestones", label: "Milestones", icon: Milestone },
  { id: "challenge", label: "Support Challenge", icon: Heart },
];

const TabBar = ({
  tab,
  onChange,
}: {
  tab: SummaryTab;
  onChange: (next: SummaryTab) => void;
}) => (
  <div className='-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0'>
    {TABS.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type='button'
        onClick={() => onChange(id)}
        aria-pressed={tab === id}
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          tab === id
            ? "bg-cyan-500/10 text-cyan-300"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
        )}>
        <Icon
          size={16}
          className={tab === id ? "text-cyan-400" : "text-zinc-500"}
        />
        {label}
      </button>
    ))}
  </div>
);

const SummaryPage: NextPageWithLayout = () => {
  const [tab, setTab] = useState<SummaryTab>("milestones");
  const userInfo = useAppSelector(selectUserInfo);
  const isMaster = userInfo?.role === "master" || userInfo?.role === "admin";

  const tabs = <TabBar tab={tab} onChange={setTab} />;

  if (tab === "challenge") {
    return (
      <div className='flex min-h-screen w-full flex-col bg-second-600 lg:mt-16'>
        <HeroBanner
          title='Support Challenge'
          subtitle='One target a week, picked and run by the supporters — claimed by everyone.'
          eyebrow='Supporters'
          eyebrowClassName='text-amber-400/80'
          backgroundContent={<HeroPattern variant='heart' />}
          className='min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
        />

        <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-14 md:gap-10 md:p-8 md:pb-20 lg:p-10 lg:pb-24'>
          {tabs}
          <SupportChallengeExplainer />
        </div>
      </div>
    );
  }

  // Milestones themselves stay behind the plan; the tab bar rides above the
  // pitch so somebody without it can still reach the challenge.
  const milestones =
    !isMaster && userInfo !== null ? (
      <div className='min-h-screen bg-zinc-950'>
        <div className='relative z-10 mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8'>
          {tabs}
        </div>

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
      <div className='flex min-h-screen flex-col overflow-visible rounded-lg border-none bg-second-600 shadow-sm lg:mt-16'>
        <PremiumGate feature='summary' requiredPlan='master'>
          <SummaryView tabs={tabs} />
        </PremiumGate>
      </div>
    );

  // Milestones are read out of your own practice history, so the page waits for
  // one. The level gate sits in front of the plan pitch, with the tab bar still
  // above it so the support challenge stays reachable either way.
  return (
    <LevelGate
      feature='summary'
      className='min-h-screen bg-zinc-950'
      header={
        <div className='relative z-10 mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8'>
          {tabs}
        </div>
      }>
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
