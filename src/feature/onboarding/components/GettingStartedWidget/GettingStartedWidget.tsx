import { useQuery } from "@tanstack/react-query";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { YouTube } from "components/Blog/YouTube";
import { HeroPattern } from "components/UI/HeroBanner";
import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { addFame, selectUserAuth } from "feature/user/store/userSlice";
import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Gift,
  Guitar,
  ListMusic,
  Lock,
  Music,
  Play,
  PlayCircle,
  Plus,
  X,
} from "lucide-react";
import Router from "next/router";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { getLocalDateKey } from "utils/converter";

import { useGettingStartedQuest } from "../../hooks/useGettingStartedQuest";
import type { GettingStartedStepId } from "../../utils/gettingStartedProgress";
import { getGettingStartedProgress } from "../../utils/gettingStartedProgress";
import { StepInfoModal } from "./StepInfoModal";
import {
  FakeButton,
  FakeInput,
  FakeStatusCard,
  TutorialSteps,
} from "./TutorialSteps";

const REWARD_FAME_AMOUNT = CASE_DEFINITIONS.standard.fameCost;

type ModalId = "intro" | "first_song" | "reward" | null;

const STEP_ICONS: Record<GettingStartedStepId, typeof Compass> = {
  first_session: Play,
  first_song: Music,
  second_day: CalendarCheck,
};

export const GettingStartedWidget = () => {
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const { userStats, activity } = useDashboardData();
  const { quest, isLoading, markStep, claimReward, isClaiming } =
    useGettingStartedQuest(userAuth);
  const { data: arsenalData, isLoading: isArsenalLoading } = useArsenalData();
  const { data: userSongsData, isLoading: isUserSongsLoading } = useQuery({
    queryKey: ["user-songs", userAuth],
    queryFn: () => getUserSongs(userAuth as string),
    enabled: !!userAuth,
    staleTime: 10 * 60 * 1000,
  });
  const [openModal, setOpenModal] = useState<ModalId>(null);

  // The activity log is already loaded once for the whole dashboard; the
  // second-day step only needs the distinct days in it.
  const practiceDays = useMemo(
    () =>
      new Set(
        (activity.reportList ?? []).map((report) =>
          getLocalDateKey(new Date(report.date)),
        ),
      ),
    [activity.reportList],
  );

  if (isLoading || isArsenalLoading || isUserSongsLoading || !quest) {
    return null;
  }

  const songCount =
    (userSongsData?.wantToLearn.length ?? 0) +
    (userSongsData?.learning.length ?? 0) +
    (userSongsData?.learned.length ?? 0);
  const sessionCount = userStats.sessionCount ?? 0;

  const progress = getGettingStartedProgress({
    quest,
    sessionCount,
    guitarCount: arsenalData?.inventory?.length ?? 0,
    songCount,
    practiceDayCount: practiceDays.size,
  });

  if (!progress.isVisible) return null;

  const hasPracticedToday = practiceDays.has(getLocalDateKey());

  const trackStepClick = (step: string) =>
    posthog.capture("getting_started_step_clicked", { step });

  const handleDismiss = () => {
    markStep({ dismissed: true });
    posthog.capture("getting_started_dismissed");
  };

  const handleClaimAndGoToArsenal = async () => {
    if (progress.canClaimReward && !isClaiming) {
      await claimReward(REWARD_FAME_AMOUNT);
      dispatch(addFame(REWARD_FAME_AMOUNT));
      posthog.capture("getting_started_reward_claimed", {
        fame: REWARD_FAME_AMOUNT,
      });
    }
    setOpenModal(null);
    Router.push("/arsenal");
  };

  const stepNode = (id: GettingStartedStepId) => {
    const step = progress.steps.find((s) => s.id === id)!;
    const base = {
      key: id,
      icon: STEP_ICONS[id],
      isDone: step.isDone,
      tone: "cyan" as const,
    };

    if (id === "first_session") {
      return {
        ...base,
        label: "First session",
        onClick: step.isDone
          ? undefined
          : () => {
              trackStepClick(id);
              Router.push("/timer");
            },
      };
    }

    if (id === "first_song") {
      return {
        ...base,
        label: "First song",
        onClick: step.isDone
          ? undefined
          : () => {
              trackStepClick(id);
              setOpenModal("first_song");
            },
      };
    }

    // Day two only opens once there is a day one, and not on the same day:
    // today's session already counts for today. The hint says which of those
    // it is, so the step never reads as a bare "Day two".
    const isWaitingForTomorrow = sessionCount > 0 && hasPracticedToday;
    return {
      ...base,
      label: "Practice a 2nd day",
      hint: step.isDone
        ? undefined
        : sessionCount === 0
          ? "After your first session"
          : isWaitingForTomorrow
            ? "Available tomorrow"
            : "Play today to finish",
      onClick:
        step.isDone || sessionCount === 0 || isWaitingForTomorrow
          ? undefined
          : () => {
              trackStepClick(id);
              Router.push("/timer");
            },
    };
  };

  /**
   * Steps and the reward on one left-to-right track. The guitar sits right
   * after the first session — it is the payoff for playing, not for finishing
   * a checklist. `onClick` being undefined marks a node as not actionable.
   */
  const nodes: {
    key: string;
    label: string;
    icon: typeof Compass;
    isDone: boolean;
    tone: "cyan" | "amber";
    onClick?: () => void;
    badge?: string;
    /** Status line under the label: what unlocks the step, or when. */
    hint?: string;
  }[] = [
    stepNode("first_session"),
    {
      key: "reward",
      label: "First guitar",
      icon: progress.rewardClaimed
        ? Guitar
        : progress.canClaimReward
          ? Gift
          : Lock,
      isDone: progress.rewardClaimed && progress.hasGuitar,
      tone: "amber",
      onClick: progress.rewardClaimed
        ? progress.hasGuitar
          ? undefined
          : () => Router.push("/arsenal")
        : progress.canClaimReward
          ? () => setOpenModal("reward")
          : undefined,
      badge: progress.rewardClaimed ? undefined : `+${REWARD_FAME_AMOUNT}`,
      // Claimed but no case opened yet — say what's left to do there.
      hint:
        progress.rewardClaimed && !progress.hasGuitar
          ? "Open a case"
          : undefined,
    },
    stepNode("first_song"),
    stepNode("second_day"),
  ];

  // Counted over every node on the track, the guitar included — "3/3" above
  // four circles read as finished while the reward was still waiting.
  const doneCount = nodes.filter((node) => node.isDone).length;

  return (
    <Card className='relative flex-col justify-between overflow-hidden p-4 sm:p-5'>
      {/* Cyan → amber, the same run the roadmap makes from its first step to
          the guitar. Colour needs more opacity than flat white did to
          register at all. */}
      <HeroPattern
        className='opacity-[0.09]'
        gradient={["#22d3ee", "#f59e0b"]}
        maskImage='linear-gradient(to left, black 0%, transparent 90%)'
      />
      <div className='relative z-10 mb-3 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2.5'>
          <Compass size={16} className='text-zinc-500' />
          <h3 className='text-sm font-semibold tracking-wide text-zinc-300'>
            Getting Started
          </h3>
          <span className='text-xs tabular-nums text-zinc-500'>
            {doneCount}/{nodes.length}
          </span>
        </div>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={() => {
              posthog.capture("getting_started_intro_opened");
              setOpenModal("intro");
            }}
            className='flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 hover:bg-white/5 hover:text-zinc-200'>
            <PlayCircle size={14} />
            2-min intro
          </button>
          <button
            type='button'
            onClick={handleDismiss}
            aria-label='Dismiss getting started checklist'
            className='rounded-full p-1 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 hover:bg-white/5 hover:text-zinc-300'>
            <X size={14} />
          </button>
        </div>
      </div>

      <div className='relative z-10 flex items-start pt-1'>
        {nodes.map((node, index) => {
          const Icon = node.isDone ? CheckCircle2 : node.icon;
          const isActionable = Boolean(node.onClick);
          const Tag = isActionable ? "button" : "div";

          return (
            <div
              key={node.key}
              className='relative flex min-w-0 flex-1 flex-col items-center sm:px-1'>
              {/* The track segment reaching back to the previous node — it
                  lights up once the node it comes from is done. Drawn before
                  the circle so the circle's own background covers its end.
                  top = the button's py-1 plus half the circle. */}
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[-50%] right-[50%] top-[22px] h-px -translate-y-1/2 sm:top-6",
                    nodes[index - 1].isDone
                      ? "bg-emerald-500/40"
                      : "bg-zinc-800",
                  )}
                />
              )}

              <Tag
                {...(isActionable
                  ? { type: "button" as const, onClick: node.onClick }
                  : {})}
                className={cn(
                  "group flex w-full flex-col items-center gap-2 rounded-lg py-1 text-center sm:gap-2.5",
                  isActionable &&
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60",
                )}>
                <span
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10",
                    node.isDone && "bg-emerald-500/10 text-emerald-400",
                    !node.isDone &&
                      !isActionable &&
                      "bg-zinc-800/60 text-zinc-500",
                    !node.isDone &&
                      isActionable &&
                      node.tone === "cyan" &&
                      "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20",
                    !node.isDone &&
                      isActionable &&
                      node.tone === "amber" &&
                      "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20",
                  )}>
                  <Icon className='h-4 w-4' />
                </span>

                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight tracking-wide sm:text-xs",
                    node.isDone && "text-zinc-500",
                    !node.isDone && isActionable && "text-zinc-200",
                    !node.isDone && !isActionable && "text-zinc-500",
                  )}>
                  {node.label}
                </span>

                {node.hint && (
                  <span
                    className={cn(
                      "-mt-1 text-[10px] leading-tight sm:-mt-1.5 sm:text-xs",
                      isActionable ? "text-cyan-400/80" : "text-zinc-500",
                    )}>
                    {node.hint}
                  </span>
                )}

                {/* A claimable reward reads as a button, not as one more step.
                    The whole node is the button, so this is only its face. */}
                {node.badge && isActionable && node.tone === "amber" ? (
                  <span className='flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-zinc-950 transition-colors group-hover:bg-amber-400 sm:text-xs'>
                    Claim {node.badge}
                    <img
                      src='/images/coin.png'
                      alt='fame'
                      className='h-3 w-3 object-contain sm:h-3.5 sm:w-3.5'
                    />
                  </span>
                ) : (
                  node.badge && (
                    <span className='flex items-center gap-1'>
                      <span
                        className={cn(
                          "text-[10px] font-medium tabular-nums sm:text-xs",
                          isActionable ? "text-amber-400" : "text-zinc-500",
                        )}>
                        {node.badge}
                      </span>
                      <img
                        src='/images/coin.png'
                        alt='fame'
                        className={cn(
                          "h-3 w-3 object-contain sm:h-3.5 sm:w-3.5",
                          !isActionable && "opacity-40",
                        )}
                      />
                    </span>
                  )
                )}
              </Tag>
            </div>
          );
        })}
      </div>

      <StepInfoModal
        isOpen={openModal === "intro"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        title='Welcome to Riff Quest'
        description='Two minutes on what this is and how it works.'
        size='wide'
        body={
          <YouTube
            id='x2wERUdqtL0'
            title='Getting Started with Riff Quest'
            className='my-0'
          />
        }
        ctaLabel='Got it'
        onCta={() => setOpenModal(null)}
      />

      <StepInfoModal
        isOpen={openModal === "first_song"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        title='Add a song you want to play'
        description='Keep track of songs you want to learn, are learning, or already know.'
        body={
          <TutorialSteps
            steps={[
              {
                text: <>Go to the Songs page and click this button:</>,
                visual: (
                  <FakeButton icon={Plus} tone='solid'>
                    Add New Song
                  </FakeButton>
                ),
              },
              {
                text: (
                  <>
                    Type the artist and title of any song you&apos;d love to
                    play. Already in the library? Just pick the match. Not there
                    yet? No problem — you&apos;re adding it:
                  </>
                ),
                visual: (
                  <span className='grid grid-cols-2 gap-2'>
                    <FakeInput label='Artist' value='Led Zeppelin' />
                    <FakeInput label='Song Title' value='Stairway to Heaven' />
                  </span>
                ),
              },
              {
                text: (
                  <>
                    Tell the app where this song is on your journey. Later you
                    can practice it section by section and watch your mastery
                    grow:
                  </>
                ),
                visual: (
                  <span className='flex flex-col gap-1.5'>
                    <FakeStatusCard
                      icon={ListMusic}
                      tone='zinc'
                      label='Want to Learn'
                      sub='Save for later inspiration'
                    />
                    <FakeStatusCard
                      icon={BookOpen}
                      tone='amber'
                      label='Learning'
                      sub='Focus on this song today'
                    />
                    <FakeStatusCard
                      icon={CheckCircle2}
                      tone='green'
                      label='Learned'
                      sub='Mastered and in repertoire'
                    />
                  </span>
                ),
              },
            ]}
          />
        }
        ctaLabel='Browse songs'
        onCta={() => {
          setOpenModal(null);
          Router.push("/songs");
        }}
      />

      <StepInfoModal
        isOpen={openModal === "reward"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        title='Draw your first guitar'
        description='You played your first session — claim your Fame and open a case.'
        body={
          <div className='space-y-3'>
            <div className='flex items-center justify-center gap-2 rounded-lg bg-zinc-900/60 py-5'>
              <span className='text-4xl font-bold tabular-nums tracking-tight text-white'>
                +{REWARD_FAME_AMOUNT}
              </span>
              <img
                src='/images/coin.png'
                alt='fame'
                className='h-8 w-8 object-contain'
              />
            </div>
            <p className='text-center text-sm leading-relaxed text-zinc-300'>
              That&apos;s exactly enough to open a case in the Arsenal. Claim it
              and you&apos;ll land there ready to pick your guitar.
            </p>
          </div>
        }
        ctaLabel='Claim & choose your guitar'
        onCta={handleClaimAndGoToArsenal}
      />
    </Card>
  );
};
