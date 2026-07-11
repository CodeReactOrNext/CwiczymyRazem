import { useQuery } from "@tanstack/react-query";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
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
  Flame,
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
  Trophy,
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
  TutorialFeature,
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
  const { data: arsenalData } = useArsenalData();
  const { data: userSongsData } = useQuery({
    queryKey: ["user-songs", userAuth],
    queryFn: () => getUserSongs(userAuth as string),
    enabled: !!userAuth,
    staleTime: 10 * 60 * 1000,
  });
  const [openModal, setOpenModal] = useState<ModalId>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  if (isLoading || !quest || !userStats) return null;

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

  const stepCopy: Record<
    Exclude<ModalId, null>,
    { title: string; subtitle: string }
  > = {
    welcome: { title: "What is Riff Quest?", subtitle: "A 30-second intro" },
    first_exercise: {
      title: "Do your first exercise",
      subtitle: "With or without note detection",
    },
    first_song: {
      title: "Add your first song",
      subtitle: "Track a song you want to learn",
    },
    exercise_plan: {
      title: "Explore exercise plans",
      subtitle: "Bundle exercises into a routine",
    },
    custom_plan: {
      title: "Build your own plan",
      subtitle: "Pick your exercises, your order",
    },
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

  return (
    <Card className='relative flex-col justify-between overflow-hidden p-4 sm:p-5'>
      <HeroPattern
        className='opacity-[0.04]'
        maskImage='linear-gradient(to left, black 0%, transparent 35%)'
      />
      <div className='relative z-10 mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-2.5'>
          <Compass size={16} className='text-zinc-500' />
          <h3 className='text-sm font-semibold tracking-wide text-zinc-300'>
            Getting Started
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          aria-label='Dismiss getting started checklist'
          className='rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300'>
          <X size={14} />
        </button>
      </div>

      <div className='relative z-10 space-y-1.5'>
        {progress.steps.map((step) => {
          const Icon = stepIcons[step.id];
          const isClickable = !step.isDone;
          return (
            <div
              key={step.id}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => isClickable && handleStepClick(step.id)}
              onKeyDown={(e) => {
                if (isClickable && (e.key === "Enter" || e.key === " "))
                  handleStepClick(step.id);
              }}
              className={cn(
                "flex min-h-[44px] items-center gap-2.5 rounded-sm p-2.5 transition-all",
                step.isDone
                  ? "bg-green-900/25 text-green-400/70"
                  : "cursor-pointer bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 active:scale-[0.98]",
              )}>
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  step.isDone
                    ? "bg-green-500/10 text-green-400/70"
                    : "bg-cyan-500/10 text-cyan-400",
                )}>
                {step.isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
              </div>
              <div className='min-w-0 flex-1'>
                <p
                  className={cn(
                    "text-sm font-medium tracking-wide",
                    step.isDone && "line-through opacity-50",
                  )}>
                  {stepCopy[step.id].title}
                </p>
                <p className='mt-0.5 truncate text-xs text-zinc-400'>
                  {stepCopy[step.id].subtitle}
                </p>
              </div>
            </div>
          );
        })}

        {/* Reward step */}
        {progress.rewardClaimed ? (
          <div
            role='button'
            tabIndex={0}
            onClick={() => Router.push("/arsenal")}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && Router.push("/arsenal")
            }
            className='flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-sm bg-zinc-800/80 p-2.5 text-zinc-300 transition-all hover:bg-zinc-700/80 active:scale-[0.98]'>
            <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400'>
              <Guitar size={14} />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium tracking-wide'>
                Draw your first guitar
              </p>
              <p className='mt-0.5 truncate text-xs text-zinc-400'>
                Open your free case in the Arsenal
              </p>
            </div>
          </div>
        ) : (
          <div
            role={canClaim ? "button" : undefined}
            tabIndex={canClaim ? 0 : undefined}
            onClick={() => canClaim && setIsRewardModalOpen(true)}
            onKeyDown={(e) => {
              if (canClaim && (e.key === "Enter" || e.key === " "))
                setIsRewardModalOpen(true);
            }}
            className={cn(
              "flex min-h-[44px] items-center gap-2.5 rounded-sm p-2.5 transition-all",
              canClaim
                ? "cursor-pointer bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 active:scale-[0.98]"
                : "bg-zinc-800/40 text-zinc-500",
            )}>
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                canClaim
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-zinc-700/40 text-zinc-600",
              )}>
              {canClaim ? <Gift size={14} /> : <Lock size={14} />}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium tracking-wide'>
                Draw your first guitar
              </p>
              <p className='mt-0.5 truncate text-xs text-zinc-400'>
                {canClaim
                  ? "Claim your reward to open a case"
                  : "Finish the steps above to unlock"}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-1.5'>
              <span
                className={cn(
                  "text-xs font-medium tracking-tight",
                  canClaim ? "text-amber-400" : "text-zinc-500",
                )}>
                +{REWARD_FAME_AMOUNT}
              </span>
              <img
                src='/images/coin.png'
                alt='fame'
                className='h-4 w-4 object-contain'
              />
            </div>
          </div>
        )}
      </div>

      <StepInfoModal
        isOpen={openModal === "welcome"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        icon={Compass}
        title='Welcome to Riff Quest'
        description="Here's the idea, in short."
        body={
          <div className='space-y-2'>
            <TutorialFeature icon={Flame} title="It's a practice tracker.">
              Do exercises built right into Riff Quest — or if that&apos;s not
              your thing, just log what you practiced yourself. We track your
              streak and save your history, session by session, so you stay
              motivated. There&apos;s also a leaderboard where you can see your
              ranking among other players.
            </TutorialFeature>
            <TutorialFeature icon={Trophy} title='Points track your progress.'>
              Every minute of practice earns{" "}
              <img
                src='/images/points.png'
                alt='points'
                className='inline h-4 w-4 -translate-y-0.5 object-contain align-middle'
              />{" "}
              points — they add up toward your level. They&apos;re not spent on
              anything, just proof of how much you&apos;ve practiced.
            </TutorialFeature>
            <TutorialFeature icon={Guitar} title='Fame is your currency.'>
              Quests and practice sessions also pay out{" "}
              <img
                src='/images/coin.png'
                alt='fame'
                className='inline h-4 w-4 -translate-y-0.5 object-contain align-middle'
              />{" "}
              Fame — a separate balance you spend in the Arsenal to open cases
              and unlock new guitars.
            </TutorialFeature>
          </div>
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
        icon={Mic2}
        title='Your first exercise'
        description='Pick any exercise and give it a shot.'
        body={
          <TutorialSteps
            steps={[
              {
                text: (
                  <>
                    Head to the exercise library and pick whatever looks fun.
                    Don&apos;t overthink it — anything works for your first one:
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
                    Now just play. You can turn on the mic so the app hears you
                    and gives real-time feedback — or skip that entirely and
                    simply log your practice time. You earn points either way:
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
        }
        ctaLabel='Browse exercises'
        onCta={() => {
          posthog.capture("getting_started_step_completed", {
            step: "first_exercise",
          });
          setOpenModal(null);
          Router.push("/exercises");
        }}
      />

      <StepInfoModal
        isOpen={openModal === "first_song"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        icon={Music}
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
        icon={ListChecks}
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
        icon={Wand2}
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
        icon={Gift}
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
