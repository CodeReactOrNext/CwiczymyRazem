import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import { addFame,selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import {
  CheckCircle2,
  Compass,
  Gift,
  Guitar,
  ListChecks,
  Lock,
  Mic2,
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

const REWARD_FAME_AMOUNT = CASE_DEFINITIONS.standard.fameCost;

type ModalId = "welcome" | "first_exercise" | "exercise_plan" | null;

export const GettingStartedWidget = () => {
  const dispatch = useAppDispatch();
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const { quest, isLoading, markStep, claimReward, isClaiming } =
    useGettingStartedQuest(userAuth);
  const { data: arsenalData } = useArsenalData();
  const [openModal, setOpenModal] = useState<ModalId>(null);

  if (isLoading || !quest || !userStats) return null;

  const progress = getGettingStartedProgress({
    quest,
    sessionCount: userStats.sessionCount ?? 0,
    guitarCount: arsenalData?.inventory?.length ?? 0,
  });

  if (!progress.isVisible) return null;

  const stepCopy: Record<
    Exclude<ModalId, null> | "custom_plan",
    { title: string; subtitle: string }
  > = {
    welcome: { title: "What is Riff Quest?", subtitle: "A 30-second intro" },
    first_exercise: { title: "Do your first exercise", subtitle: "With or without note detection" },
    exercise_plan: { title: "Explore exercise plans", subtitle: "Bundle exercises into a routine" },
    custom_plan: { title: "Build your own plan", subtitle: "Pick your exercises, your order" },
  };

  const stepIcons: Record<Exclude<ModalId, null> | "custom_plan", typeof Compass> = {
    welcome: Compass,
    first_exercise: Mic2,
    exercise_plan: ListChecks,
    custom_plan: Wand2,
  };

  const handleDismiss = () => {
    markStep({ dismissed: true });
    posthog.capture("getting_started_dismissed");
  };

  const handleClaim = async () => {
    if (isClaiming || progress.rewardClaimed) return;
    await claimReward(REWARD_FAME_AMOUNT);
    dispatch(addFame(REWARD_FAME_AMOUNT));
    posthog.capture("getting_started_reward_claimed", { fame: REWARD_FAME_AMOUNT });
  };

  const handleStepClick = (stepId: (typeof progress.steps)[number]["id"]) => {
    if (stepId === "custom_plan") {
      markStep({ customPlanClicked: true });
      posthog.capture("getting_started_step_completed", { step: stepId });
      Router.push("/plans/create");
      return;
    }
    setOpenModal(stepId);
  };

  return (
    <Card className='flex-col justify-between p-5 sm:p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Compass size={18} className='text-zinc-700' />
          <h3 className='text-[12px] font-semibold tracking-wide text-zinc-400'>
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

      <div className='mb-4 space-y-2'>
        {progress.steps.map((step) => {
          const Icon = stepIcons[step.id];
          return (
            <div
              key={step.id}
              role={!step.isDone ? "button" : undefined}
              tabIndex={!step.isDone ? 0 : undefined}
              onClick={() => !step.isDone && handleStepClick(step.id)}
              onKeyDown={(e) => {
                if (!step.isDone && (e.key === "Enter" || e.key === " ")) handleStepClick(step.id);
              }}
              className={cn(
                "flex min-h-[52px] items-center gap-3 rounded-sm p-3 transition-all",
                step.isDone
                  ? "bg-green-900/25 text-green-400/70"
                  : "cursor-pointer bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 active:scale-[0.98]"
              )}>
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  step.isDone ? "bg-green-500/10 text-green-400/70" : "bg-cyan-500/10 text-cyan-400"
                )}>
                {step.isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <div className='min-w-0 flex-1'>
                <p
                  className={cn(
                    "text-xs font-medium tracking-wide",
                    step.isDone && "line-through opacity-50"
                  )}>
                  {stepCopy[step.id].title}
                </p>
                <p className='truncate text-[11px] text-zinc-500'>{stepCopy[step.id].subtitle}</p>
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
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && Router.push("/arsenal")}
            className='flex min-h-[52px] cursor-pointer items-center gap-3 rounded-sm bg-zinc-800/80 p-3 text-zinc-300 transition-all hover:bg-zinc-700/80 active:scale-[0.98]'>
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400'>
              <Guitar size={16} />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-medium tracking-wide'>Draw your first guitar</p>
              <p className='truncate text-[11px] text-zinc-500'>Open your free case in the Arsenal</p>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex min-h-[52px] items-center gap-3 rounded-sm p-3 transition-all",
              progress.allStepsDone ? "bg-zinc-800/80 text-zinc-300" : "bg-zinc-800/40 text-zinc-600"
            )}>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                progress.allStepsDone ? "bg-amber-500/10 text-amber-400" : "bg-zinc-700/40 text-zinc-600"
              )}>
              {progress.allStepsDone ? <Gift size={16} /> : <Lock size={16} />}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-medium tracking-wide'>Draw your first guitar</p>
              <p className='truncate text-[11px] text-zinc-500'>
                {progress.allStepsDone
                  ? `Claim ${REWARD_FAME_AMOUNT} Fame to open a case`
                  : "Finish the steps above to unlock"}
              </p>
            </div>
          </div>
        )}
      </div>

      {progress.allStepsDone && !progress.rewardClaimed && (
        <Button
          onClick={handleClaim}
          disabled={isClaiming}
          className='h-10 w-full rounded-sm bg-gradient-to-r from-orange-500 to-amber-500 text-xs font-bold tracking-wide text-white shadow-md shadow-orange-500/20 transition-all hover:scale-105 disabled:opacity-60'>
          <span className='flex items-center gap-2'>
            <Gift size={14} />
            Claim {REWARD_FAME_AMOUNT}
            <img src='/images/coin.png' alt='fame' className='h-5 w-5 object-contain' />
          </span>
        </Button>
      )}

      <StepInfoModal
        isOpen={openModal === "welcome"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        icon={Compass}
        title='Welcome to Riff Quest'
        description="Here's the idea, in short."
        body={
          <ul className='list-inside list-disc space-y-1'>
            <li>Practice guitar and log your sessions.</li>
            <li>Earn points and level up as you go.</li>
            <li>Collect gear and guitars for your Arsenal.</li>
          </ul>
        }
        ctaLabel="Got it, let's go"
        onCta={() => {
          markStep({ welcomeSeen: true });
          posthog.capture("getting_started_step_completed", { step: "welcome" });
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
          <p>
            Practice sessions can listen through your mic and auto-detect notes and chords for
            real-time feedback — or you can just follow along and log your time manually.
            Whichever you prefer, you earn points either way.
          </p>
        }
        ctaLabel='Browse exercises'
        onCta={() => {
          posthog.capture("getting_started_step_completed", { step: "first_exercise" });
          setOpenModal(null);
          Router.push("/exercises");
        }}
      />

      <StepInfoModal
        isOpen={openModal === "exercise_plan"}
        onOpenChange={(isOpen) => !isOpen && setOpenModal(null)}
        icon={ListChecks}
        title='Structure it with a Plan'
        description='Exercise plans bundle several exercises into one guided routine.'
        body={<p>Follow a ready-made plan step by step, or use it as your daily warm-up.</p>}
        ctaLabel='View plans'
        onCta={() => {
          markStep({ planIntroSeen: true });
          posthog.capture("getting_started_step_completed", { step: "exercise_plan" });
          setOpenModal(null);
          Router.push("/plans");
        }}
      />
    </Card>
  );
};
