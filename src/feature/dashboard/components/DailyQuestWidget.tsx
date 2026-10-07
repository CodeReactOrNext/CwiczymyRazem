import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { selectDailyQuest } from "feature/user/store/userSlice";
import {
  claimQuestRewardAction,
  DAILY_QUEST_FAME_REWARD,
  DAILY_QUEST_POINTS_REWARD,
  initializeDailyQuestAction,
} from "feature/user/store/userSlice.questActions";
import { useTranslation } from "hooks/useTranslation";
import { CheckCircle2, ChevronRight, Gift, Swords } from "lucide-react";
import Router from "next/router";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { DailyQuestTask, DailyQuestTaskType } from "types/api.types";

const questRoutes: Record<DailyQuestTaskType, string> = {
  rate_song: "/songs?view=library",
  add_want_to_learn: "/songs?view=management",
  practice_any_song: "/songs?view=board",
  healthy_habits: "/report",
  auto_plan: "/timer/auto",
  practice_plan: "/timer/plans",
  practice_total_time: "/songs?view=board",
  practice_technique_time: "/timer/plans",
  practice_specific_exercise: "/profile/skills", // Base path, handled dynamically
  practice_theory_time: "/timer/plans",
  practice_hearing_time: "/timer/plans",
  practice_creativity_time: "/timer/plans",
  creativity_focus: "/timer/plans",
  long_session: "/songs?view=board",
  well_rounded: "/timer/plans",
  two_categories_min: "/timer/plans",
  balanced_session: "/timer/plans",
  rate_multiple_songs: "/songs?view=library",
  complete_two_plans: "/timer/plans",
  improve_skill: "/profile/skills",
  practice_three_exercises: "/profile/skills?tab=browse",
};

const DailyQuestSkeleton = () => {
  const { t } = useTranslation("dashboard");
  return (
    <Card className='flex-col justify-between p-5 sm:p-6'>
      <div className='mb-5 flex items-start gap-3'>
        <Swords size={18} className='mt-px shrink-0 text-zinc-700' />
        <div>
          <h3 className='text-[12px] font-semibold tracking-wide text-zinc-400'>
            {t("daily_quests.title")}
          </h3>
          <div className='mt-2 h-3 w-40 rounded bg-white/[0.06]' />
        </div>
      </div>
      <div className='mb-4 animate-pulse space-y-2'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className='flex min-h-[52px] items-center justify-between rounded-sm bg-zinc-800/60 px-3 py-2.5'>
            <div className='h-3 w-40 rounded bg-white/[0.08]' />
            <div className='h-3 w-8 rounded bg-white/[0.08]' />
          </div>
        ))}
      </div>
    </Card>
  );
};

const progressPercent = (task: DailyQuestTask) =>
  Math.min(100, (task.progress / Math.max(1, task.target)) * 100);

export const DailyQuestWidget = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();
  const dailyQuest = useAppSelector(selectDailyQuest);

  useEffect(() => {
    dispatch(initializeDailyQuestAction());
  }, [dispatch]);

  if (!dailyQuest) return <DailyQuestSkeleton />;

  const allCompleted = dailyQuest.tasks.every((task) => task.isCompleted);
  const isClaimed = dailyQuest.isRewardClaimed;

  const handleClaim = () => {
    if (allCompleted && !isClaimed) {
      dispatch(claimQuestRewardAction());
    }
  };

  const openTask = (task: DailyQuestTask) => {
    if (task.type === "practice_specific_exercise" && task.exerciseId) {
      Router.push(`/profile/skills?exerciseId=${task.exerciseId}`);
    } else {
      Router.push(questRoutes[task.type]);
    }
  };

  const taskLabel = (task: DailyQuestTask) =>
    task.type === "practice_specific_exercise"
      ? t("daily_quests.tasks.practice_specific_exercise", {
          exercise: task.title.replace(/^Practice: /, ""),
        })
      : t(`daily_quests.tasks.${task.type}`, task.title);

  return (
    <Card className='flex-col justify-between p-5 sm:p-6'>
      <div className='mb-5 flex items-start gap-3'>
        <Swords size={18} className='mt-px shrink-0 text-zinc-700' />
        <div className='min-w-0'>
          <h3 className='text-[12px] font-semibold tracking-wide text-zinc-400'>
            {t("daily_quests.title")}
          </h3>
          {/* The reward is for the whole set, so it sits next to the rule that
              earns it instead of floating in the corner. */}
          {!isClaimed && (
            <p className='mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400'>
              <span>
                {t("daily_quests.reward_hint", {
                  count: dailyQuest.tasks.length,
                })}
              </span>
              <span className='flex items-center gap-1 font-semibold text-cyan-400'>
                +{DAILY_QUEST_POINTS_REWARD}
                <img
                  src='/images/points.png'
                  alt='points'
                  className='h-4 w-4 object-contain'
                />
              </span>
              <span className='flex items-center gap-1 font-semibold text-amber-400'>
                +{DAILY_QUEST_FAME_REWARD}
                <img
                  src='/images/coin.png'
                  alt='fame'
                  className='h-4 w-4 object-contain'
                />
              </span>
            </p>
          )}
        </div>
      </div>

      <div className='mb-4 space-y-2'>
        {dailyQuest.tasks.map((task) =>
          task.isCompleted ? (
            <div
              key={task.id}
              className='flex min-h-[52px] items-center justify-between gap-3 rounded-sm bg-green-900/25 px-3 py-2.5 text-green-400/70'>
              <span className='text-xs font-medium tracking-wide line-through opacity-50'>
                {taskLabel(task)}
              </span>
              <CheckCircle2 size={16} className='shrink-0 text-green-500/70' />
            </div>
          ) : (
            <button
              key={task.id}
              type='button'
              onClick={() => openTask(task)}
              className='group flex min-h-[52px] w-full items-center gap-3 rounded-sm bg-zinc-800/80 px-3 py-2.5 text-left text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:bg-zinc-700/80 hover:text-zinc-100'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-baseline justify-between gap-3'>
                  <span className='text-xs font-medium tracking-wide'>
                    {taskLabel(task)}
                  </span>
                  <span className='shrink-0 text-xs font-semibold tabular-nums text-zinc-200'>
                    {task.progress}/{task.target}
                  </span>
                </div>
                <div className='mt-2 h-1 overflow-hidden rounded-full bg-zinc-900/80'>
                  <div
                    className='h-full rounded-full bg-cyan-400 transition-[width] duration-500'
                    style={{ width: `${progressPercent(task)}%` }}
                  />
                </div>
              </div>
              <ChevronRight
                size={16}
                className='shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-100'
              />
            </button>
          ),
        )}
      </div>

      {allCompleted && !isClaimed && (
        <Button
          onClick={handleClaim}
          className='h-10 w-full rounded-sm bg-gradient-to-r from-orange-500 to-amber-500 text-xs font-bold tracking-wide text-white shadow-md shadow-orange-500/20 transition-all hover:scale-105'>
          <span className='flex items-center gap-2'>
            <Gift size={14} className='animate-bounce' />
            {t("daily_quests.claim", {
              points: DAILY_QUEST_POINTS_REWARD,
            })}{" "}
            <img
              src='/images/points.png'
              alt='points'
              className='h-5 w-5 object-contain'
            />
            + {DAILY_QUEST_FAME_REWARD}{" "}
            <img
              src='/images/coin.png'
              alt='fame'
              className='h-5 w-5 object-contain'
            />
          </span>
        </Button>
      )}

      {isClaimed && (
        <div className='flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-white/5 bg-zinc-800/40 text-xs font-black uppercase tracking-widest text-zinc-400'>
          <CheckCircle2 size={14} className='text-emerald-500' />
          {t("daily_quests.claimed")}
        </div>
      )}
    </Card>
  );
};
