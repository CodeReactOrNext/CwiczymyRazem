import { useQuery } from "@tanstack/react-query";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { YouTube } from "components/Blog/YouTube";
import { HeroPattern } from "components/UI/HeroBanner";
import { VideoClip } from "components/UI/VideoClip";
import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import {
  addFame,
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Ear,
  Gift,
  Guitar,
  Lightbulb,
  ListChecks,
  ListMusic,
  Lock,
  Mic2,
  Music,
  PenLine,
  Plus,
  Timer,
  Wand2,
  X,
} from "lucide-react";
import Router from "next/router";
import posthog from "posthog-js";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

import { useGettingStartedQuest } from "../../hooks/useGettingStartedQuest";
import { getGettingStartedProgress } from "../../utils/gettingStartedProgress";
import { StepInfoModal } from "./StepInfoModal";
import {
  FakeButton,
  FakeInput,
  FakeNavPath,
  FakePlanCard,
  FakeStatusCard,
  TutorialSteps,
} from "./TutorialSteps";

const REWARD_FAME_AMOUNT = CASE_DEFINITIONS.standard.fameCost;

type ModalId =
  | "welcome"
  | "first_exercise"
  | "first_song"
  | "exercise_plan"
  | "custom_plan"
  | null;

export const GettingStartedWidget = () => {
  const dispatch = useAppDispatch();
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
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
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  if (
    isLoading ||
    isArsenalLoading ||
    isUserSongsLoading ||
    !quest ||
    !userStats
  )
    return null;

  const songCount =
    (userSongsData?.wantToLearn.length ?? 0) +
    (userSongsData?.learning.length ?? 0) +
    (userSongsData?.learned.length ?? 0);

  const progress = getGettingStartedProgress({
    quest,
    sessionCount: userStats.sessionCount ?? 0,
    guitarCount: arsenalData?.inventory?.length ?? 0,
    songCount,
  });

  if (!progress.isVisible) return null;

  const canClaim = progress.allStepsDone;

  // The roadmap has room for a couple of words under each node, so these are
  // deliberately shorter than the headings the matching modals open with.
  const stepLabels: Record<Exclude<ModalId, null>, string> = {
    welcome: "Intro",
    first_exercise: "First exercise",
    first_song: "First song",
    exercise_plan: "Explore plans",
    custom_plan: "Your own plan",
  };

  const stepIcons: Record<Exclude<ModalId, null>, typeof Compass> = {
    welcome: Compass,
    first_exercise: Mic2,
    first_song: Music,
    exercise_plan: ListChecks,
    custom_plan: Wand2,
  };

  const handleDismiss = () => {
    markStep({ dismissed: true });
    posthog.capture("getting_started_dismissed");
  };

  const handleClaimAndGoToArsenal = async () => {
    if (!progress.rewardClaimed && !isClaiming) {
      await claimReward(REWARD_FAME_AMOUNT);
      dispatch(addFame(REWARD_FAME_AMOUNT));
      posthog.capture("getting_started_reward_claimed", {
        fame: REWARD_FAME_AMOUNT,
      });
    }
    setIsRewardModalOpen(false);
    Router.push("/arsenal");
  };

  const handleStepClick = (stepId: (typeof progress.steps)[number]["id"]) => {
    setOpenModal(stepId);
  };

  /**
   * The guided steps and the reward flattened into one left-to-right track, so
   * the reward reads as the destination rather than a separate row below.
   * `onClick` being undefined is what marks a node as not yet actionable.
   */
  const nodes: {
    key: string;
    label: string;
    icon: typeof Compass;
    isDone: boolean;
    tone: "cyan" | "amber";
    onClick?: () => void;
    badge?: string;
  }[] = [
    ...progress.steps.map((step) => ({
      key: step.id,
      label: stepLabels[step.id],
      icon: stepIcons[step.id],
      isDone: step.isDone,
      tone: "cyan" as const,
      onClick: step.isDone ? undefined : () => handleStepClick(step.id),
    })),
    {
      key: "reward",
      label: "First guitar",
      icon: progress.rewardClaimed ? Guitar : canClaim ? Gift : Lock,
      isDone: false,
      tone: "amber" as const,
      onClick: progress.rewardClaimed
        ? () => Router.push("/arsenal")
        : canClaim
          ? () => setIsRewardModalOpen(true)
          : undefined,
      badge: progress.rewardClaimed ? undefined : `+${REWARD_FAME_AMOUNT}`,
    },
  ];

  const doneCount = progress.steps.filter((step) => step.isDone).length;

  return (
    <Card className='relative flex-col justify-between overflow-hidden p-4 sm:p-5'>
      {/* Cyan → amber, the same run the roadmap makes from its first step to
          the guitar at the end. Colour needs more opacity than flat white did
          to register at all. */}
      <HeroPattern
        className='opacity-[0.09]'
        gradient={["#22d3ee", "#f59e0b"]}
        maskImage='linear-gradient(to left, black 0%, transparent 90%)'
      />
      <div className='relative z-10 mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-2.5'>
          <Compass size={16} className='text-zinc-500' />
          <h3 className='text-sm font-semibold tracking-wide text-zinc-300'>
            Getting Started
          </h3>
          <span className='text-xs tabular-nums text-zinc-500'>
            {doneCount}/{progress.steps.length}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          aria-label='Dismiss getting started checklist'
          className='rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300'>
          <X size={14} />
        </button>
      </div>

      {/* Six nodes have to fit a 320px phone without scrolling, so everything
          below shrinks a step on mobile: 36px circles, 10px labels, no
          horizontal padding between nodes. */}
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
                  "group flex w-full flex-col items-center gap-2 rounded-lg py-1 text-center transition-transform sm:gap-2.5",
                  isActionable && "cursor-pointer active:scale-[0.97]",
                )}>
                <span
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10",
                    node.isDone && "bg-emerald-500/10 text-emerald-400",
                    !node.isDone &&
                      !isActionable &&
                      "bg-zinc-800/60 text-zinc-600",
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
                    !node.isDone && !isActionable && "text-zinc-600",
                  )}>
                  {node.label}
                </span>

                {node.badge && (
                  <span className='flex items-center gap-1'>
                    <span
                      className={cn(
                        "text-[10px] font-medium tabular-nums sm:text-xs",
                        isActionable ? "text-amber-400" : "text-zinc-600",
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
                )}
              </Tag>
            </div>
          );
        })}
      </div>

      <StepInfoModal
        isOpen={openModal === "welcome"}
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
        ctaLabel="Got it, let's go"
        onCta={() => {
          markStep({ welcomeSeen: true });
          posthog.capture("getting_started_step_completed", {
            step: "welcome",
          });
          setOpenModal(null);
        }}
      />

      <StepInfoModal
        isOpen={openModal === "first_exercise"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        title='Your first exercise'
        description='Pick any exercise and give it a shot.'
        size='wide'
        body={
          <>
            <VideoClip
              src='/guide/exercise.mp4'
              label='Screen recording: picking an exercise and starting practice'
              className='my-0 mb-5'
            />
            <TutorialSteps
              steps={[
                {
                  text: (
                    <>
                      Head to the exercise library and pick whatever looks fun.
                      Don&apos;t overthink it — anything works for your first
                      one:
                    </>
                  ),
                  visual: (
                    <span className='flex flex-wrap gap-1.5'>
                      <FakeButton icon={Guitar}>Technique</FakeButton>
                      <FakeButton icon={BookOpen} tone='violet'>
                        Theory
                      </FakeButton>
                      <FakeButton icon={Ear} tone='sky'>
                        Hearing
                      </FakeButton>
                      <FakeButton icon={Lightbulb} tone='orange'>
                        Creativity
                      </FakeButton>
                    </span>
                  ),
                },
                {
                  text: <>On the exercise page, click this to start:</>,
                  visual: (
                    <FakeButton tone='cyanSolid'>Start Practice →</FakeButton>
                  ),
                },
                {
                  text: (
                    <>
                      Now just play. You can turn on the mic so the app hears
                      you and gives real-time feedback — or skip that entirely
                      and simply log your practice time. You earn points either
                      way:
                    </>
                  ),
                  visual: (
                    <span className='flex flex-wrap items-center gap-1.5'>
                      <FakeButton icon={Mic2}>Note detection</FakeButton>
                      <span className='text-xs text-zinc-500'>or</span>
                      <FakeButton icon={PenLine} tone='zinc'>
                        Log time manually
                      </FakeButton>
                    </span>
                  ),
                },
              ]}
            />
          </>
        }
        ctaLabel='Browse exercises'
        onCta={() => {
          posthog.capture("getting_started_step_completed", {
            step: "first_exercise",
          });
          setOpenModal(null);
          Router.push("/profile/skills?tab=browse");
        }}
      />

      <StepInfoModal
        isOpen={openModal === "first_song"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        title='Add your first song'
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
                    Tell the app where this song is on your journey — click one
                    of these. Later you can practice it section by section and
                    watch your mastery grow:
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
          posthog.capture("getting_started_step_completed", {
            step: "first_song",
          });
          setOpenModal(null);
          Router.push("/songs");
        }}
      />

      <StepInfoModal
        isOpen={openModal === "exercise_plan"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        title='Structure it with a Plan'
        description='Exercise plans bundle several exercises into one guided routine.'
        body={
          <TutorialSteps
            steps={[
              {
                text: (
                  <>
                    Open the plan picker — you&apos;ll find ready-made routines
                    and play-alongs for every level, plus plans shared by other
                    players. You can always come back to it here:
                  </>
                ),
                visual: (
                  <FakeNavPath
                    items={[
                      { icon: Timer, label: "Practice" },
                      { icon: ListChecks, label: "Plans" },
                    ]}
                  />
                ),
              },
              {
                text: (
                  <>
                    Click any plan to peek inside — you&apos;ll see exactly
                    which exercises it contains and how long it takes:
                  </>
                ),
                visual: (
                  <FakePlanCard
                    title='Beginner Daily Routine'
                    duration='20 min'
                    exercises='5 exercises'
                  />
                ),
              },
              {
                text: (
                  <>
                    Hit{" "}
                    <span className='font-semibold text-cyan-300'>Start</span>{" "}
                    and just follow along. The timer moves you from exercise to
                    exercise, so you never wonder what&apos;s next.
                  </>
                ),
              },
            ]}
          />
        }
        ctaLabel='Browse plans'
        onCta={() => {
          markStep({ planIntroSeen: true });
          posthog.capture("getting_started_step_completed", {
            step: "exercise_plan",
          });
          setOpenModal(null);
          Router.push("/timer/plans");
        }}
      />

      <StepInfoModal
        isOpen={openModal === "custom_plan"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        title='Build your own plan'
        description='Compose your ideal routine out of any exercises.'
        body={
          <TutorialSteps
            steps={[
              {
                text: (
                  <>
                    Open the plan builder and name your routine — something like
                    this:
                  </>
                ),
                visual: <FakeInput label='Plan name' value='Morning warm-up' />,
              },
              {
                text: (
                  <>
                    Pick any exercises you like and put them in your order. You
                    decide how long each one runs:
                  </>
                ),
                visual: (
                  <span className='flex flex-wrap gap-1.5'>
                    <FakeButton tone='zinc'>1 · Spider Walk</FakeButton>
                    <FakeButton tone='zinc'>2 · Alternate Picking</FakeButton>
                    <FakeButton tone='zinc'>3 · Chord Changes</FakeButton>
                  </span>
                ),
              },
              {
                text: (
                  <>
                    Save it and it&apos;s yours — from now on, one click starts
                    the whole routine, any day:
                  </>
                ),
                visual: (
                  <FakeButton icon={Plus} tone='solid'>
                    Save plan
                  </FakeButton>
                ),
              },
            ]}
          />
        }
        ctaLabel='Open plan builder'
        onCta={() => {
          markStep({ customPlanClicked: true });
          posthog.capture("getting_started_step_completed", {
            step: "custom_plan",
          });
          setOpenModal(null);
          Router.push("/plans/create");
        }}
      />

      <StepInfoModal
        isOpen={isRewardModalOpen}
        onOpenChange={setIsRewardModalOpen}
        title='Draw your first guitar'
        description="You've earned it — claim your Fame and open a case."
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
