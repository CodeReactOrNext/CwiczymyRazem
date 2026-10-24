import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { addPlayerJoinedLog } from "feature/logs/services/addPlayerJoinedLog.service";
import type { Variants } from "framer-motion";
import { m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { EASE, fadeUp, transitions } from "lib/motion/motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  FileMusic,
  Library,
  ListMusic,
  Loader2,
  Monitor,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import type { OnboardingStep } from "../analytics/onboardingAnalytics";
import {
  createOnboardingClock,
  parseOnboardingSource,
  trackOnboardingBack,
  trackOnboardingCompleted,
  trackOnboardingDesktopHintContinued,
  trackOnboardingGoalChosen,
  trackOnboardingLevelChosen,
  trackOnboardingPlanChosen,
  trackOnboardingSkipped,
  trackOnboardingViewed,
} from "../analytics/onboardingAnalytics";
import type { GoalOption } from "../data/onboardingGoals";
import {
  ALL_PLANS_COUNT,
  ALL_PLANS_HREF,
  getGoalOptions,
  getOnboardingPlans,
  getPlanHref,
  getPlanMinutes,
  LEVEL_OPTIONS,
  SONGS_HREF,
} from "../data/onboardingGoals";
import { firebaseSaveOnboarding } from "../services/onboarding.service";
import type {
  OnboardingGoal,
  OnboardingLevel,
  OnboardingResult,
} from "../types";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

/**
 * `desktop` comes after every answer is in, on phones only, right before the
 * player is sent on — it asks nothing, so it gets no segment of its own.
 */
type Step = OnboardingStep | "desktop";

/**
 * The progress bar's segment for each step: the questions, then the third
 * one for whatever follows the goal — plan picker or the songs explainer.
 */
const PROGRESS: Record<Step, number> = {
  level: 0,
  goal: 1,
  plan: 2,
  songs: 2,
  desktop: 2,
};
const PROGRESS_SEGMENTS = 3;

const StepHeading = ({
  title,
  description,
  onBack,
}: {
  title: string;
  /** Only where the title can't carry the message alone — the questions don't need one. */
  description?: string;
  onBack?: () => void;
}) => {
  const { t } = useTranslation("onboarding");
  return (
  <div className='mx-auto mb-8 max-w-xl space-y-3 text-center sm:mb-10'>
    <h1 className='text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl'>
      {title}
    </h1>
    {description && (
      <p className='text-base leading-relaxed text-zinc-300'>{description}</p>
    )}
    {onBack && (
      <button
        type='button'
        onClick={onBack}
        className={cn(
          "mx-auto !mt-5 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200",
          FOCUS_RING,
        )}>
        <ArrowLeft className='h-4 w-4' />
        {t("back")}
      </button>
    )}
  </div>
  );
};

/** A few bars of tab, shown so the strike through them reads at a glance. */
const TAB_LINES = [
  "e|-----0-----3---|",
  "B|---1-----0-----|",
  "G|-0-----0-------|",
  "D|---------------|",
  "A|-3-------------|",
  "E|---------3-----|",
];

/**
 * "No tabs here": a greyed-out tab gets struck through once the step settles,
 * so the first thing a songs player learns is the thing they expected.
 */
const TabsNotIncluded = () => {
  const { t } = useTranslation("onboarding");
  return (
    <div className='relative flex flex-col items-center gap-3 rounded-lg bg-zinc-900/40 px-6 py-5'>
      <div aria-hidden className='relative'>
        <pre className='font-mono text-[11px] leading-[14px] text-zinc-600'>
          {TAB_LINES.join("\n")}
        </pre>
        {/* framer-motion owns this element's transform, so the tilt goes
            through `style`, not a rotate class it would overwrite. */}
        <m.span
          className='absolute left-[-6%] top-[68%] h-0.5 w-[112%] origin-left rounded-full bg-orange-400'
          style={{ rotate: -12 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ ...transitions.slow, delay: 0.4 }}
        />
      </div>
      <m.span
        className='text-sm font-medium text-orange-400'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...transitions.base, delay: 0.8 }}>
        {t("songs_step.no_tabs")}
      </m.span>
    </div>
  );
};

const SONG_FEATURES: { key: string; icon: LucideIcon }[] = [
  { key: "library", icon: ListMusic },
  { key: "time", icon: Clock },
  { key: "sources", icon: FileMusic },
];

/** Waits for the strike and its label, then lists the rows one by one. */
const AFTER_STRIKE: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 1 } },
};

/** What a songs player does get, arriving one by one after the strike. */
const SongFeatures = () => {
  const { t } = useTranslation("onboarding");
  return (
    <m.ul
      className='space-y-2'
      initial='hidden'
      animate='visible'
      variants={AFTER_STRIKE}>
      {SONG_FEATURES.map(({ key, icon: Icon }) => (
        <m.li
          key={key}
          variants={fadeUp}
          className='flex items-center gap-3 rounded-lg bg-zinc-900/40 px-3 py-2.5'>
          <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
            <Icon className='h-4 w-4' />
          </span>
          <span className='min-w-0 text-sm leading-snug text-zinc-200'>
            {t(`songs_step.features.${key}`)}
          </span>
        </m.li>
      ))}
    </m.ul>
  );
};

/** One phone → computer hop, in seconds; the dot and the glow share it. */
const HOP_LOOP = 2.4;
/** Track width (w-20) minus the dot (w-2): how far the dot travels. */
const HOP_DISTANCE = 72;

/**
 * Phone → computer: a dot leaves the phone, crosses a dotted track and lands
 * in the monitor, which lights up as it arrives. With reduced motion on the dot
 * stays put and only fades, and the glow still plays.
 */
const PhoneToDesktop = () => (
  <div
    aria-hidden
    className='flex items-center justify-center gap-5 rounded-lg bg-zinc-900/40 py-14'>
    <Smartphone className='h-10 w-10 text-zinc-400' />

    <span className='relative flex w-20 items-center justify-between'>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className='h-1 w-1 rounded-full bg-zinc-700' />
      ))}
      <m.span
        className='absolute left-0 h-2 w-2 rounded-full bg-cyan-400'
        animate={{
          x: [0, 0, HOP_DISTANCE, HOP_DISTANCE],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: HOP_LOOP,
          times: [0, 0.15, 0.75, 0.85],
          ease: EASE.inOut,
          repeat: Infinity,
        }}
      />
    </span>

    <span className='relative flex items-center justify-center'>
      <m.span
        className='absolute inset-0 rounded-full bg-cyan-400/25 blur-xl'
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{
          duration: HOP_LOOP,
          times: [0, 0.7, 0.85, 1],
          repeat: Infinity,
        }}
      />
      <Monitor className='relative h-16 w-16 text-cyan-400' />
    </span>
  </div>
);

/** Fades each step in as it replaces the previous one. */
const StepBody = ({ children }: { children: ReactNode }) => (
  <div className='duration-base animate-in fade-in slide-in-from-bottom-2'>
    {children}
  </div>
);

const GoalTile = ({
  option,
  isWide,
  isPending,
  isDimmed,
  onClick,
}: {
  option: GoalOption;
  isWide: boolean;
  isPending: boolean;
  isDimmed: boolean;
  onClick: () => void;
}) => {
  const { t } = useTranslation("onboarding");

  return (
    <button
      type='button'
      disabled={isPending || isDimmed}
      onClick={onClick}
      className={cn(
        "group flex overflow-hidden rounded-lg bg-zinc-900/60 text-left transition-colors disabled:cursor-default hover:bg-zinc-800/60 sm:flex-col",
        FOCUS_RING,
        isWide && "sm:col-span-2",
        isDimmed && "opacity-50",
      )}>
      <span
        className={cn(
          "relative block min-h-[112px] w-28 shrink-0 sm:w-full",
          isWide ? "sm:h-52" : "sm:h-40",
        )}>
        <Image
          src={option.image}
          alt=''
          fill
          sizes='(min-width: 640px) 440px, 112px'
          className={cn(
            "object-cover opacity-60 transition-opacity duration-base group-hover:opacity-90",
            option.imagePosition,
          )}
        />
        {/* Lets the screenshot sink into the tile instead of ending on an
            edge — the tile's own background, not a line. */}
        <span
          aria-hidden
          className='absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/60 sm:bg-gradient-to-b sm:from-transparent sm:via-transparent sm:to-zinc-900/90'
        />
        {isPending && (
          <span className='absolute inset-0 flex items-center justify-center bg-zinc-950/50'>
            <Loader2 className='h-5 w-5 animate-spin text-zinc-200' />
          </span>
        )}
      </span>

      <span className='flex min-w-0 flex-1 items-center gap-3 p-4 sm:p-5'>
        <span className='min-w-0 flex-1'>
          <span className='block text-base font-medium text-zinc-100'>
            {t(`goals.${option.goal}.label`, option.label)}
          </span>
          <span className='mt-1 block text-sm leading-relaxed text-zinc-400'>
            {t(`goals.${option.goal}.description`, option.description)}
          </span>
        </span>
        <ArrowRight className='h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-200' />
      </span>
    </button>
  );
};

/**
 * How long the player has played decides which answers the next question
 * offers, and which plans the plan step lists. Every answer shows the real
 * screen it leads to, and picking the plan stays the player's call — from a
 * short list for their level or the full library.
 */
const OnboardingView = () => {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const [step, setStep] = useState<Step>("level");
  const [level, setLevel] = useState<OnboardingLevel>("new");
  const [pending, setPending] = useState<string | null>(null);
  // Held by the desktop step while a phone player reads it.
  const [destination, setDestination] = useState<{
    href: string;
    goal: OnboardingGoal;
  } | null>(null);
  const isMobile = useResponsiveStore((state) => state.isMobile);
  // Where the player came from (?from=signup / google_signup), read once.
  const source = parseOnboardingSource(router.query.from);
  // Time-on-step and total duration for the events below.
  const [clock] = useState(createOnboardingClock);

  useEffect(() => {
    clock.restart();
    trackOnboardingViewed(source);
    // Once per mount — a re-render must not count as a second view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (next: OnboardingStep) => {
    if (step === "desktop") return;
    trackOnboardingBack({
      fromStep: step,
      level,
      timeOnStepMs: clock.takeStep(),
    });
    setStep(next);
  };

  const finish = async (
    result: Omit<OnboardingResult, "level">,
    href: string,
    key: string,
  ) => {
    setPending(key);
    trackOnboardingCompleted({
      level,
      goal: result.goal,
      planId: result.planId ?? null,
      destination: href,
      durationMs: clock.total(),
      source,
    });
    await firebaseSaveOnboarding({ level, ...result }).catch(() => null);
    // After the save: the feed's welcome row reads the goal and plan off the user document.
    void addPlayerJoinedLog();
    // The answers are saved by now, so a phone player who closes the tab on
    // the desktop step loses nothing.
    if (isMobile) {
      clock.takeStep();
      void router.prefetch(href);
      setDestination({ href, goal: result.goal });
      setPending(null);
      setStep("desktop");
      return;
    }
    await router.push(href);
  };

  const handleDesktopContinue = async () => {
    if (!destination || pending) return;
    setPending("desktop");
    trackOnboardingDesktopHintContinued({
      level,
      goal: destination.goal,
      timeOnStepMs: clock.takeStep(),
      source,
    });
    await router.push(destination.href);
  };

  const handleLevel = (next: OnboardingLevel, position: number) => {
    trackOnboardingLevelChosen({
      level: next,
      position,
      timeOnStepMs: clock.takeStep(),
      source,
    });
    setLevel(next);
    setStep("goal");
  };

  const handleGoal = (option: GoalOption, position: number) => {
    if (pending) return;
    trackOnboardingGoalChosen({
      goal: option.goal,
      level,
      position,
      optionsShown: getGoalOptions(level).map((o) => o.goal),
      timeOnStepMs: clock.takeStep(),
      source,
    });
    if (option.href === null) {
      setStep("plan");
      return;
    }
    // Songs players expected tabs; they see what they get before committing.
    if (option.goal === "songs") {
      setStep("songs");
      return;
    }
    finish({ goal: option.goal }, option.href, option.goal);
  };

  const handleSongsContinue = () => {
    if (pending) return;
    clock.takeStep();
    finish({ goal: "songs" }, SONGS_HREF, "songs");
  };

  const handlePlan = (plan: ExercisePlan, position: number) => {
    if (pending) return;
    trackOnboardingPlanChosen({
      plan: {
        id: plan.id,
        title: plan.title,
        difficulty: plan.difficulty,
        minutes: getPlanMinutes(plan),
        position,
      },
      level,
      timeOnStepMs: clock.takeStep(),
      source,
    });
    finish({ goal: "plans", planId: plan.id }, getPlanHref(plan.id), plan.id);
  };

  const handleAllPlans = () => {
    if (pending) return;
    trackOnboardingPlanChosen({
      plan: null,
      level,
      timeOnStepMs: clock.takeStep(),
      source,
    });
    finish({ goal: "plans" }, ALL_PLANS_HREF, "all-plans");
  };

  const handleSkip = () => {
    if (step === "desktop") return;
    trackOnboardingSkipped({
      step,
      level: step === "level" ? null : level,
      durationMs: clock.total(),
      source,
    });
    // Skipping is still a new player arriving — they get a feed row, just without a goal on it.
    void addPlayerJoinedLog();
  };

  const goals = getGoalOptions(level);
  const stepIndex = PROGRESS[step];

  return (
    <div className='flex min-h-[100dvh] flex-col bg-zinc-950 text-zinc-100'>
      <header className='mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:px-6'>
        <Image
          src='/images/longlightlogo.svg'
          alt='Riff Quest'
          width={100}
          height={24}
          className='block max-h-5 w-auto'
          priority
        />
        {/* Nothing is left to skip once the answers are in. */}
        {step !== "desktop" && (
          <Link
            href='/dashboard'
            onClick={handleSkip}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200",
              FOCUS_RING,
            )}>
            {t("skip")}
          </Link>
        )}
      </header>

      <div
        className='mx-auto flex w-full max-w-4xl gap-2 px-4 sm:px-6'
        role='progressbar'
        aria-label={t("progress")}
        aria-valuemin={1}
        aria-valuemax={PROGRESS_SEGMENTS}
        aria-valuenow={stepIndex + 1}>
        {Array.from({ length: PROGRESS_SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-base",
              i <= stepIndex ? "bg-cyan-400" : "bg-zinc-800",
            )}
          />
        ))}
      </div>

      <main className='mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-16'>
        {step === "level" && (
          <StepBody key='level'>
            <StepHeading title={t("level_step.title")} />
            <div className='grid gap-4 sm:grid-cols-3'>
              {LEVEL_OPTIONS.map((option, index) => (
                <button
                  key={option.level}
                  type='button'
                  onClick={() => handleLevel(option.level, index + 1)}
                  className={cn(
                    "group flex items-center gap-5 rounded-lg bg-zinc-900/60 p-5 text-left transition-colors hover:bg-zinc-800/60 sm:flex-col sm:items-stretch sm:gap-6 sm:p-6",
                    FOCUS_RING,
                  )}>
                  <span className='flex w-24 shrink-0 flex-col sm:w-auto'>
                    <span className='font-teko text-6xl font-medium tabular-nums leading-none text-zinc-100 transition-colors duration-base group-hover:text-cyan-400 sm:text-8xl'>
                      {option.years}
                    </span>
                    <span className='text-sm text-zinc-500'>{t(`levels.${option.level}.unit`, option.unit)}</span>
                  </span>
                  <span className='min-w-0'>
                    <span className='block text-base font-medium text-zinc-100'>
                      {t(`levels.${option.level}.label`, option.label)}
                    </span>
                    <span className='mt-1 block text-sm leading-relaxed text-zinc-400'>
                      {t(`levels.${option.level}.description`, option.description)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </StepBody>
        )}

        {step === "goal" && (
          <StepBody key='goal'>
            <StepHeading
              title={t("goal_step.title")}
              onBack={pending ? undefined : () => goTo("level")}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              {goals.map((option, index) => (
                <GoalTile
                  key={option.goal}
                  option={option}
                  // An odd count leaves one tile alone on its row; the first
                  // one takes the full width instead.
                  isWide={index === 0 && goals.length % 2 === 1}
                  isPending={pending === option.goal}
                  isDimmed={!!pending && pending !== option.goal}
                  onClick={() => handleGoal(option, index + 1)}
                />
              ))}
            </div>
          </StepBody>
        )}

        {step === "plan" && (
          <StepBody key='plan'>
            <StepHeading
              title={t("plan_step.title")}
              onBack={pending ? undefined : () => goTo("goal")}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              {getOnboardingPlans(level).map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => handlePlan(plan, index + 1)}
                  onStart={() => handlePlan(plan, index + 1)}
                  startButtonText={t("plan_step.open")}
                  isLoading={pending === plan.id}
                />
              ))}
            </div>
            <button
              type='button'
              onClick={handleAllPlans}
              disabled={!!pending}
              className={cn(
                "mx-auto mt-8 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100",
                FOCUS_RING,
              )}>
              {pending === "all-plans" ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Library className='h-4 w-4 text-zinc-400' />
              )}
              {t("plan_step.browse_all", { count: ALL_PLANS_COUNT })}
            </button>
          </StepBody>
        )}

        {step === "songs" && (
          <StepBody key='songs'>
            <StepHeading
              title={t("songs_step.title")}
              description={t("songs_step.description")}
            />
            {/* Sized to fit a phone screen without scrolling, buttons included. */}
            <div className='mx-auto max-w-md space-y-5'>
              <TabsNotIncluded />
              <SongFeatures />
              <div className='space-y-1'>
                <Button
                  size='lg'
                  className='w-full'
                  onClick={handleSongsContinue}
                  disabled={!!pending}>
                  {pending === "songs" ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    t("songs_step.continue")
                  )}
                </Button>
                {/* The way back is as plain as the way on: no tabs may be a
                    dealbreaker, and another answer is one tap away. */}
                <button
                  type='button'
                  onClick={() => goTo("goal")}
                  disabled={!!pending}
                  className={cn(
                    "flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200",
                    FOCUS_RING,
                  )}>
                  <ArrowLeft className='h-4 w-4' />
                  {t("songs_step.other")}
                </button>
              </div>
            </div>
          </StepBody>
        )}

        {step === "desktop" && (
          <StepBody key='desktop'>
            <StepHeading
              title={t("desktop_hint.title")}
              description={t("desktop_hint.description")}
            />
            <div className='mx-auto max-w-md space-y-8'>
              <PhoneToDesktop />
              <Button
                size='lg'
                className='w-full'
                onClick={handleDesktopContinue}
                disabled={!!pending}>
                {pending === "desktop" ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  t("desktop_hint.continue")
                )}
              </Button>
            </div>
          </StepBody>
        )}
      </main>
    </div>
  );
};

export default OnboardingView;
