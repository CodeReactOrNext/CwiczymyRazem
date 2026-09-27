import { cn } from "assets/lib/utils";
import { postChatWelcome } from "feature/chat/services/chatService";
import { PlanCard } from "feature/exercisePlan/components/PlanCard";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { ArrowLeft, ArrowRight, Library, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { OnboardingStep } from "../analytics/onboardingAnalytics";
import {
  createOnboardingClock,
  parseOnboardingSource,
  trackOnboardingBack,
  trackOnboardingCompleted,
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
} from "../data/onboardingGoals";
import { firebaseSaveOnboarding } from "../services/onboarding.service";
import type { OnboardingLevel, OnboardingResult } from "../types";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

const STEPS: OnboardingStep[] = ["level", "goal", "plan"];
type Step = OnboardingStep;

const StepHeading = ({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack?: () => void;
}) => (
  <div className='mx-auto mb-10 max-w-xl space-y-3 text-center'>
    <h1 className='text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl'>
      {title}
    </h1>
    <p className='text-base leading-relaxed text-zinc-400'>{description}</p>
    {onBack && (
      <button
        type='button'
        onClick={onBack}
        className={cn(
          "mx-auto !mt-5 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200",
          FOCUS_RING,
        )}>
        <ArrowLeft className='h-4 w-4' />
        Back
      </button>
    )}
  </div>
);

/** Fades each step in as it replaces the previous one. */
const StepBody = ({ children }: { children: ReactNode }) => (
  <div className='duration-300 animate-in fade-in slide-in-from-bottom-2'>
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
  const Icon = option.icon;

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
            "object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-90",
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
          <span className='flex items-center gap-2 text-base font-medium text-zinc-100'>
            <Icon className='h-4 w-4 shrink-0 text-zinc-400' />
            {option.label}
          </span>
          <span className='mt-1 block text-sm leading-relaxed text-zinc-400'>
            {option.description}
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
  const [step, setStep] = useState<Step>("level");
  const [level, setLevel] = useState<OnboardingLevel>("new");
  const [pending, setPending] = useState<string | null>(null);
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

  const goTo = (next: Step) => {
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
    // After the save: the welcome card reads the goal and plan off the user document.
    void postChatWelcome();
    await router.push(href);
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
    finish({ goal: option.goal }, option.href, option.goal);
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
    trackOnboardingSkipped({
      step,
      level: step === "level" ? null : level,
      durationMs: clock.total(),
      source,
    });
    // Skipping is still a new player arriving — they get a card, just without a goal on it.
    void postChatWelcome();
  };

  const goals = getGoalOptions(level);
  const stepIndex = STEPS.indexOf(step);

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
        <Link
          href='/dashboard'
          onClick={handleSkip}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200",
            FOCUS_RING,
          )}>
          Skip for now
        </Link>
      </header>

      <div
        className='mx-auto flex w-full max-w-4xl gap-2 px-4 sm:px-6'
        role='progressbar'
        aria-label='Setup progress'
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={stepIndex + 1}>
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= stepIndex ? "bg-cyan-400" : "bg-zinc-800",
            )}
          />
        ))}
      </div>

      <main className='mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-12 sm:px-6 sm:pt-16'>
        {step === "level" && (
          <StepBody key='level'>
            <StepHeading
              title='How long have you been playing?'
              description='So we only show you what fits where you are.'
            />
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
                    <span className='font-teko text-6xl font-medium tabular-nums leading-none text-zinc-100 transition-colors duration-300 group-hover:text-cyan-400 sm:text-8xl'>
                      {option.years}
                    </span>
                    <span className='text-sm text-zinc-500'>{option.unit}</span>
                  </span>
                  <span className='min-w-0'>
                    <span className='block text-base font-medium text-zinc-100'>
                      {option.label}
                    </span>
                    <span className='mt-1 block text-sm leading-relaxed text-zinc-400'>
                      {option.description}
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
              title='What brings you to Riff Quest?'
              description='Pick where to start. Everything else stays one click away.'
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
              title='Pick a plan to start with'
              description='Short routines where the timer walks you through each exercise. Nothing starts until you press Play — with the mic for live feedback, or without it.'
              onBack={pending ? undefined : () => goTo("goal")}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              {getOnboardingPlans(level).map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => handlePlan(plan, index + 1)}
                  onStart={() => handlePlan(plan, index + 1)}
                  startButtonText='Open plan'
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
              Browse all {ALL_PLANS_COUNT} plans
            </button>
          </StepBody>
        )}
      </main>
    </div>
  );
};

export default OnboardingView;
