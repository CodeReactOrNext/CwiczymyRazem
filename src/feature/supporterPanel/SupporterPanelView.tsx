import { cn } from "assets/lib/utils";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { CommunityGoalCard } from "feature/communityGoal/components/CommunityGoalCard";
import { GoalBallot } from "feature/communityGoal/components/GoalBallot";
import { GearBoardTab } from "feature/gearProposals/components/GearBoardTab";
import { GuildFoundingPanel } from "feature/guilds/components/GuildFoundingPanel";
import { SupporterCaseTab } from "feature/supporterCase/components/SupporterCaseTab";
import { RoadmapBoardTab } from "feature/supporterPanel/components/RoadmapBoardTab";
import { SupporterInfo } from "feature/supporterPanel/components/SupporterInfo";
import { SupporterPitch } from "feature/supporterPanel/components/SupporterPitch";
import { TokenWalletBar } from "feature/supporterPanel/components/TokenWalletBar";
import { useSupporterRoadmap } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { selectUserAuth } from "feature/user/store/userSlice";
import { WorkBoardTab } from "feature/workBoard/components/WorkBoardTab";
import {
  Guitar,
  Hammer,
  Info,
  Map,
  Package,
  Shield,
  Target,
} from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

type SupporterTab =
  | "roadmap"
  | "gear"
  | "case"
  | "guild"
  | "work"
  | "goal"
  | "info";

const TABS: { id: SupporterTab; label: string; icon: typeof Map }[] = [
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "gear", label: "Gear", icon: Guitar },
  { id: "case", label: "Supporter Case", icon: Package },
  { id: "guild", label: "Found a Guild", icon: Shield },
  { id: "work", label: "In the works", icon: Hammer },
  { id: "goal", label: "Support Challenge", icon: Target },
  { id: "info", label: "Info", icon: Info },
];

/** A tab somebody linked to — the gear board sends people back to its own. */
const isSupporterTab = (value: unknown): value is SupporterTab =>
  TABS.some((candidate) => candidate.id === value);

/**
 * The supporter panel: one shell, six surfaces and their prices, one wallet.
 *
 * The page wears the same full-bleed banner as Milestones and Arsenal, and the
 * wallet rides in it rather than in a card of its own. Every tab here spends
 * the same wallet, and the tabs that used to draw their own copy of it left
 * the case, the work board and the goal ballot asking for tokens without ever
 * saying how many were left.
 */
export const SupporterPanelView = () => {
  const router = useRouter();
  const [tab, setTab] = useState<SupporterTab>(() =>
    isSupporterTab(router.query.tab) ? router.query.tab : "roadmap",
  );

  /**
   * The open tab lives in the URL as well as in state, so a page of its own —
   * writing a gear proposal — can send somebody back to the board they left
   * rather than to the roadmap.
   */
  const openTab = (next: SupporterTab) => {
    setTab(next);
    void router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: next } },
      undefined,
      { shallow: true },
    );
  };

  const userAuth = useAppSelector(selectUserAuth);
  const { isSupport, isLoading: isRosterLoading } = useSupportTeam();
  const isSupporter = isSupport(userAuth);

  const { data: board, isLoading } = useSupporterRoadmap(isSupporter);

  return (
    <div className='font-openSans flex w-full flex-col'>
      <HeroBanner
        title='Supporter panel'
        subtitle='See what is being built, pick what comes next, and set the week the whole app plays.'
        eyebrow='Supporters'
        eyebrowClassName='text-amber-400/80'
        backgroundContent={<HeroPattern variant='heart' />}
        className='min-h-[150px] w-full !rounded-none !shadow-none md:min-h-[120px] lg:min-h-[140px]'
        rightContent={
          isSupporter ? (
            board ? (
              <TokenWalletBar wallet={board.wallet} />
            ) : (
              <div className='h-[42px] w-[190px] max-w-full animate-pulse rounded-lg bg-zinc-900/60' />
            )
          ) : undefined
        }
      />

      <div className='mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 pb-14 sm:p-6 md:p-8 md:pb-20 lg:p-10 lg:pb-24'>
        {isRosterLoading ? (
          // The roster answers "not a supporter" for everyone until it lands,
          // so waiting is what keeps a supporter off the sales pitch.
          <div className='h-72 animate-pulse rounded-lg bg-zinc-900/40' />
        ) : !isSupporter ? (
          <SupporterPitch />
        ) : (
          <>
            {/* Scrolls sideways on a phone rather than wrapping into three rows. */}
            <div className='-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0'>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type='button'
                  onClick={() => openTab(id)}
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

            {tab === "roadmap" && (
              <RoadmapBoardTab board={board} isLoading={isLoading} />
            )}

            {tab === "gear" && <GearBoardTab enabled={isSupporter} />}

            {tab === "case" && (
              <SupporterCaseTab wallet={board?.wallet} enabled={isSupporter} />
            )}

            {tab === "guild" && (
              <GuildFoundingPanel
                wallet={board?.wallet}
                enabled={isSupporter}
              />
            )}

            {tab === "work" && <WorkBoardTab enabled={isSupporter} />}

            {tab === "goal" && (
              <div className='space-y-8'>
                <CommunityGoalCard />

                <div className='space-y-4'>
                  <div className='flex flex-col gap-1'>
                    <h2 className='text-sm font-bold text-zinc-200'>
                      Next week is yours to pick
                    </h2>
                    <p className='text-sm text-zinc-400'>
                      Spend a token on the goal you want the whole app playing
                      for. Whatever is running now sits this one out.
                    </p>
                  </div>

                  <GoalBallot tokensLeft={board?.wallet.left ?? 0} />
                </div>
              </div>
            )}

            {tab === "info" && <SupporterInfo />}
          </>
        )}
      </div>
    </div>
  );
};
