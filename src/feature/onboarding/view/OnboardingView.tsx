import {
  Button,
  buttonVariants,
  PRESSABLE_KEY,
} from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { type KostekMood, KostekSays } from "components/Mascot/Kostek";
import { addPlayerJoinedLog } from "feature/logs/services/addPlayerJoinedLog.service";
import { firebaseUpdateDailyGoalMinutes } from "feature/settings/services/settings.service";
import { setDailyGoalMinutes } from "feature/user/store/userSlice";
import { m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Guitar,
  MousePointerClick,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAppDispatch } from "store/hooks";

import type { OnboardingStep } from "../analytics/onboardingAnalytics";
import {
  createOnboardingClock,
  parseOnboardingSource,
  trackOnboardingBack,
  trackOnboardingCompleted,
  trackOnboardingDailyGoalChosen,
  trackOnboardingLevelChosen,
  trackOnboardingPlayChosen,
  trackOnboardingSkipped,
  trackOnboardingViewed,
} from "../analytics/onboardingAnalytics";
import {
  DAILY_GOAL_CHOICES,
  FIRST_HUNT_DURATION_LABEL,
  FIRST_HUNT_PREVIEWS,
  FIRST_RIFF_DURATION_LABEL,
  FIRST_RIFF_IMAGE,
  getFirstHuntHref,
  getFirstRiffExercise,
  getFirstRiffHref,
  LEVEL_OPTIONS,
} from "../data/onboardingGoals";
import { firebaseSaveOnboarding } from "../services/onboarding.service";
import { getTourHref } from "../tour/tourSteps";
import type { OnboardingLevel, OnboardingPlayChoice } from "../types";
import { HuntPreview } from "./HuntPreview";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

const STEPS: OnboardingStep[] = ["level", "daily", "first"];
const PREVIOUS: Partial<Record<OnboardingStep, OnboardingStep>> = {
  daily: "level",
  first: "daily",
};

/** Kostek's face for each question; a picked answer gets a nod ("approve"). */
const STEP_MOOD: Record<OnboardingStep, KostekMood> = {
  level: "idle",
  daily: "think",
  first: "ready",
};

/** How long a picked answer stays green before the next question comes in. */
const PICK_MS = 350;

const FIRST_CHOICES: OnboardingPlayChoice[] = ["play", "hunt", "browse"];

/**
 * One thick bar for the three questions, the same as the goal bar on the
 * session summary: emerald, with the white highlight along its top.
 */
const ProgressBar = ({ value, label }: { value: number; label: string }) => {
  const percent = (value / STEPS.length) * 100;
  return (
    <div
      role='progressbar'
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={STEPS.length}
      aria-valuenow={value}
      className='relative h-3.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800'>
      <m.div
        className='absolute inset-y-0 left-0 rounded-full bg-emerald-500'
        initial={false}
        animate={{ width: `${percent}%` }}
        transition={{ type: "spring", stiffness: 170, damping: 18 }}>
        <span
          aria-hidden
          className='light-hide absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/30'
        />
      </m.div>
    </div>
  );
};

/** The number key that picks an answer; only where there is a keyboard. */
const ShortcutKey = ({ children }: { children: ReactNode }) => (
  <kbd className='hidden h-6 min-w-6 place-items-center rounded-md border-b-2 border-black bg-zinc-800 px-1.5 font-sans text-xs font-semibold text-zinc-400 lg:grid'>
    {children}
  </kbd>
);

/**
 * Every answer is a key: a face, the lip, and a press. Picked, it turns green
 * with a tick for a moment before the next question; the others fade.
 */
const AnswerKey = ({
  picked,
  dimmed,
  disabled,
  shortcut,
  onClick,
  className,
  cornerClassName,
  children,
}: {
  picked: boolean;
  dimmed: boolean;
  disabled: boolean;
  shortcut?: number;
  onClick: () => void;
  className?: string;
  /** Where the tick and the number key sit; top right by default. */
  cornerClassName?: string;
  children: ReactNode;
}) => (
  <button
    type='button'
    disabled={disabled}
    onClick={onClick}
    data-picked={picked}
    className={cn(
      PRESSABLE_KEY,
      "group relative flex rounded-lg text-left font-normal transition-[background-color,opacity] duration-fast disabled:cursor-default",
      picked ? "bg-emerald-500/15" : "bg-zinc-900 enabled:hover:bg-zinc-800/80",
      dimmed && "opacity-40",
      FOCUS_RING,
      className,
    )}>
    <span className={cn("absolute right-3 top-3 z-10 flex", cornerClassName)}>
      {picked ? (
        <span className='grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-zinc-950'>
          <Check className='h-3.5 w-3.5' strokeWidth={3.5} />
        </span>
      ) : (
        shortcut !== undefined && <ShortcutKey>{shortcut}</ShortcutKey>
      )}
    </span>
    {children}
  </button>
);

/** Answer text that turns green with its key. */
const PICKED_TEXT = "group-data-[picked=true]:text-emerald-300";

/** The text half of a first-minute card: what it is, how long, what it needs. */
const FirstMinuteText = ({
  title,
  duration,
  description,
  needs,
}: {
  title: string;
  duration: string;
  description: string;
  needs: ReactNode;
}) => (
  <span className='flex min-w-0 flex-1 flex-col gap-1.5 p-4 sm:p-5'>
    <span className='flex items-start justify-between gap-3'>
      <span
        className={cn(
          "min-w-0 text-base font-medium text-zinc-100",
          PICKED_TEXT,
        )}>
        {title}
      </span>
      <span className='shrink-0 font-teko text-3xl font-medium tabular-nums leading-none text-zinc-100 sm:text-4xl'>
        {duration}
      </span>
    </span>
    <span className='text-sm leading-relaxed text-zinc-400'>{description}</span>
    <span className='mt-1'>{needs}</span>
  </span>
);

/**
 * Three questions, then straight into playing: how long the player has been
 * playing, how long a day they want to practise (written to Settings → Daily
 * goal on the spot) and what to do with the first minute — a 40-second riff,
 * a minute of finding notes on the neck (no guitar needed) or a look around.
 * Every way out lands on Home, where Kostek's tour starts.
 *
 * The daily goal comes before the first minute on purpose: about half the
 * players who open the first riff never come back from it, and a question
 * after it would reach only the other half.
 */
const OnboardingView = () => {
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<OnboardingStep>("level");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [level, setLevel] = useState<OnboardingLevel>("new");
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  // The answer showing green before the next question, or the one being opened.
  const [picked, setPicked] = useState<string | null>(null);
  // Where the player came from (?from=signup / google_signup), read once.
  const source = parseOnboardingSource(router.query.from);
  // Time-on-step and total duration for the events below.
  const [clock] = useState(createOnboardingClock);
  const pickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = picked !== null;

  useEffect(() => {
    clock.restart();
    trackOnboardingViewed(source);
    return () => {
      if (pickTimer.current) clearTimeout(pickTimer.current);
    };
    // Once per mount — a re-render must not count as a second view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Shows the answer green for a moment, then runs what it leads to. */
  const confirm = (key: string, then: () => void) => {
    if (busy) return;
    setPicked(key);
    pickTimer.current = setTimeout(then, PICK_MS);
  };

  const moveTo = (next: OnboardingStep, to: "forward" | "back") => {
    setDirection(to);
    setPicked(null);
    setStep(next);
  };

  const goBack = () => {
    const previous = PREVIOUS[step];
    if (!previous || busy) return;
    trackOnboardingBack({
      fromStep: step,
      level,
      timeOnStepMs: clock.takeStep(),
    });
    moveTo(previous, "back");
  };

  const handleLevel = (next: OnboardingLevel, position: number) =>
    confirm(next, () => {
      trackOnboardingLevelChosen({
        level: next,
        position,
        timeOnStepMs: clock.takeStep(),
        source,
      });
      setLevel(next);
      moveTo("daily", "forward");
    });

  const handleDailyGoal = (minutes: number, position: number) =>
    confirm(`daily-${minutes}`, () => {
      trackOnboardingDailyGoalChosen({
        minutes,
        level,
        position,
        timeOnStepMs: clock.takeStep(),
        source,
      });
      setDailyGoal(minutes);
      // The same setting as Settings → Daily goal, saved now: a player who
      // leaves during the first minute keeps it. The store copy keeps Home's
      // chart in step without a reload.
      dispatch(setDailyGoalMinutes(minutes));
      void firebaseUpdateDailyGoalMinutes(minutes).catch(() => null);
      moveTo("first", "forward");
    });

  const handleFirst = (choice: OnboardingPlayChoice) =>
    confirm(choice, async () => {
      trackOnboardingPlayChosen({
        choice,
        level,
        timeOnStepMs: clock.takeStep(),
        source,
      });
      const href =
        choice === "play"
          ? getFirstRiffHref(level, source)
          : choice === "hunt"
            ? getFirstHuntHref(level, source)
            : getTourHref(null);
      trackOnboardingCompleted({
        level,
        dailyGoalMinutes: dailyGoal,
        playChoice: choice,
        destination: href,
        durationMs: clock.total(),
        source,
      });
      await firebaseSaveOnboarding({
        level,
        dailyGoalMinutes: dailyGoal,
        playChoice: choice,
      }).catch(() => null);
      // After the save: the feed's welcome row reads the user document.
      void addPlayerJoinedLog();
      await router.push(href);
    });

  const handleSkip = () => {
    trackOnboardingSkipped({
      step,
      level: step === "level" ? null : level,
      durationMs: clock.total(),
      source,
    });
    // Skipping is still a new player arriving — they get a feed row too.
    void addPlayerJoinedLog();
  };

  // The answers on screen, in order, for the number keys.
  const answers: (() => void)[] =
    step === "level"
      ? LEVEL_OPTIONS.map((option, i) => () => handleLevel(option.level, i + 1))
      : step === "daily"
        ? DAILY_GOAL_CHOICES.map(
            (choice, i) => () => handleDailyGoal(choice.minutes, i + 1),
          )
        : FIRST_CHOICES.map((choice) => () => handleFirst(choice));

  // Swapped in as the step renders, so a key pressed right after a question
  // changes already answers the new one.
  useLayoutEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const { target } = event;
      if (
        target instanceof Element &&
        target.closest("input, textarea, [contenteditable='true']")
      )
        return;
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || !answers[index]) return;
      event.preventDefault();
      answers[index]();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answers]);

  const question: Record<OnboardingStep, string> = {
    level: t("level_step.title"),
    daily: t("daily_step.title"),
    first: t("first_step.title"),
  };
  const isPicked = (key: string) => picked === key;
  const isDimmed = (key: string) => busy && picked !== key;
  const riffBpm = getFirstRiffExercise(level).metronomeSpeed?.recommended;
  const huntPreview = FIRST_HUNT_PREVIEWS[level];

  return (
    <div className='flex min-h-[100dvh] flex-col bg-zinc-950 text-zinc-100'>
      <header className='mx-auto flex w-full max-w-4xl items-center gap-3 px-4 pt-4 sm:gap-4 sm:px-6 sm:pt-6'>
        <Image
          src='/images/longlightlogo.svg'
          alt='Riff Quest'
          width={100}
          height={24}
          className='mr-4 hidden max-h-5 w-auto lg:block'
          priority
        />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={t("back")}
          onClick={goBack}
          disabled={busy}
          className={cn("shrink-0", !PREVIOUS[step] && "invisible")}>
          <ArrowLeft />
        </Button>
        <ProgressBar value={STEPS.indexOf(step) + 1} label={t("progress")} />
        <Link
          href={getTourHref(null)}
          onClick={handleSkip}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0",
          )}>
          {t("skip")}
        </Link>
      </header>

      <main className='mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 sm:pt-10'>
        {/* On a computer the question and its answers sit in the middle of
            the window, not against its top edge. */}
        <div className='lg:my-auto lg:pb-12'>
          {/* Kostek asks every question. On a phone it sits small on the left
              and the bubble takes the rest of the row, so the question needs
              one or two lines and the answers start above the fold. */}
          <KostekSays
            heading
            text={question[step]}
            mood={picked ? "approve" : STEP_MOOD[step]}
            cue={picked ? `${step}-picked` : step}
            short
            lively
            arrive
            delay={0.25}
            className='mb-6 w-full justify-start gap-3 sm:mx-auto sm:mb-10 sm:max-w-2xl sm:justify-center sm:gap-5'
            kostekClassName='h-16 sm:h-28'
            bubbleClassName='w-fit max-w-full px-4 py-3 text-xl font-semibold leading-snug tracking-tight sm:px-6 sm:py-4 sm:text-3xl'
            bubbleSlotClassName='min-w-0 flex-1 shrink sm:w-[28rem] sm:flex-none'
          />

          <div
            key={step}
            className={cn(
              "duration-base animate-in fade-in",
              direction === "forward"
                ? "slide-in-from-right-8"
                : "slide-in-from-left-8",
            )}>
            {step === "level" && (
              <div className='grid gap-3 sm:grid-cols-3 sm:gap-4'>
                {LEVEL_OPTIONS.map((option, index) => (
                  <AnswerKey
                    key={option.level}
                    picked={isPicked(option.level)}
                    dimmed={isDimmed(option.level)}
                    disabled={busy}
                    shortcut={index + 1}
                    onClick={() => handleLevel(option.level, index + 1)}
                    className='items-center gap-5 p-5 pr-12 sm:flex-col sm:items-stretch sm:gap-6 sm:p-6'>
                    <span className='flex w-24 shrink-0 flex-col sm:w-auto'>
                      <span
                        className={cn(
                          "font-teko text-6xl font-medium tabular-nums leading-none text-zinc-100 sm:text-8xl",
                          PICKED_TEXT,
                        )}>
                        {option.years}
                      </span>
                      <span className='text-sm text-zinc-500'>
                        {t(`levels.${option.level}.unit`, option.unit)}
                      </span>
                    </span>
                    <span className='min-w-0'>
                      <span
                        className={cn(
                          "block text-base font-medium text-zinc-100",
                          PICKED_TEXT,
                        )}>
                        {t(`levels.${option.level}.label`, option.label)}
                      </span>
                      <span className='mt-1 block text-sm leading-relaxed text-zinc-400'>
                        {t(
                          `levels.${option.level}.description`,
                          option.description,
                        )}
                      </span>
                    </span>
                  </AnswerKey>
                ))}
              </div>
            )}

            {step === "daily" && (
              <>
                <p className='-mt-2 mb-5 text-sm text-zinc-400 sm:-mt-4 sm:mb-8 sm:text-center'>
                  {t("daily_step.hint")}
                </p>
                <div className='grid gap-3 sm:grid-cols-4 sm:gap-4'>
                  {DAILY_GOAL_CHOICES.map((choice, index) => {
                    const key = `daily-${choice.minutes}`;
                    return (
                      <AnswerKey
                        key={choice.minutes}
                        picked={isPicked(key)}
                        dimmed={isDimmed(key)}
                        disabled={busy}
                        shortcut={index + 1}
                        onClick={() =>
                          handleDailyGoal(choice.minutes, index + 1)
                        }
                        cornerClassName='top-1/2 -translate-y-1/2 sm:top-3 sm:translate-y-0'
                        className='items-center gap-4 px-5 py-3 pr-14 sm:flex-col sm:items-stretch sm:gap-5 sm:p-6'>
                        <span className='flex w-16 shrink-0 flex-col sm:w-auto'>
                          <span
                            className={cn(
                              "font-teko text-5xl font-medium tabular-nums leading-none text-zinc-100 sm:text-7xl",
                              PICKED_TEXT,
                            )}>
                            {choice.minutes}
                          </span>
                          <span className='text-sm text-zinc-500'>
                            {t("daily_step.unit")}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "ml-auto text-sm text-zinc-400 sm:ml-0",
                            PICKED_TEXT,
                          )}>
                          {t(`daily_step.vibes.${choice.vibe}`)}
                        </span>
                      </AnswerKey>
                    );
                  })}
                </div>
              </>
            )}

            {step === "first" && (
              <>
                <div className='grid gap-3 sm:grid-cols-2 sm:gap-4'>
                  <AnswerKey
                    picked={isPicked("play")}
                    dimmed={isDimmed("play")}
                    disabled={busy}
                    shortcut={1}
                    onClick={() => handleFirst("play")}
                    cornerClassName='left-2.5 top-auto bottom-2.5 right-auto sm:bottom-auto sm:left-auto sm:right-3 sm:top-3'
                    className='overflow-hidden sm:flex-col'>
                    <span className='relative block min-h-[128px] w-28 shrink-0 bg-zinc-950 sm:h-40 sm:w-full'>
                      <Image
                        src={FIRST_RIFF_IMAGE}
                        alt=''
                        fill
                        sizes='(min-width: 640px) 440px, 112px'
                        className='object-cover object-left'
                      />
                    </span>
                    <FirstMinuteText
                      title={t("first_step.riff_title")}
                      duration={FIRST_RIFF_DURATION_LABEL}
                      description={t(`first_step.riff_levels.${level}`, {
                        bpm: riffBpm ?? "",
                      })}
                      needs={
                        <span className='inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400'>
                          <Guitar className='h-3.5 w-3.5' />
                          {t("first_step.riff_needs")}
                        </span>
                      }
                    />
                  </AnswerKey>

                  <AnswerKey
                    picked={isPicked("hunt")}
                    dimmed={isDimmed("hunt")}
                    disabled={busy}
                    shortcut={2}
                    onClick={() => handleFirst("hunt")}
                    cornerClassName='left-2.5 top-auto bottom-2.5 right-auto sm:bottom-auto sm:left-auto sm:right-3 sm:top-3'
                    className='overflow-hidden sm:flex-col'>
                    <span className='relative block min-h-[128px] w-28 shrink-0 bg-zinc-950 sm:h-40 sm:w-full'>
                      <HuntPreview preview={huntPreview} />
                      <span className='absolute left-2 top-2 rounded-md bg-zinc-950/85 px-2 py-0.5 text-xs font-medium text-zinc-400'>
                        {t("first_step.hunt_find")}{" "}
                        <b className='font-bold text-zinc-100'>
                          {huntPreview.target}
                        </b>
                      </span>
                    </span>
                    <FirstMinuteText
                      title={t("first_step.hunt_title")}
                      duration={FIRST_HUNT_DURATION_LABEL}
                      description={t(`first_step.hunt_levels.${level}`)}
                      needs={
                        <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300'>
                          <MousePointerClick className='h-3.5 w-3.5' />
                          {t("first_step.hunt_needs")}
                        </span>
                      }
                    />
                  </AnswerKey>
                </div>

                <AnswerKey
                  picked={isPicked("browse")}
                  dimmed={isDimmed("browse")}
                  disabled={busy}
                  shortcut={3}
                  onClick={() => handleFirst("browse")}
                  cornerClassName='top-1/2 -translate-y-1/2'
                  className='mt-4 w-full items-center px-4 py-3 pr-14 text-sm font-medium text-zinc-300'>
                  <span className={cn("flex-1", PICKED_TEXT)}>
                    {t("first_step.browse")}
                  </span>
                  <ArrowRight className='h-4 w-4 shrink-0 text-zinc-500 group-data-[picked=true]:hidden lg:hidden' />
                </AnswerKey>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingView;
