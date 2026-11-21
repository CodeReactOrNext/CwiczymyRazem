import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useClientNow } from "components/ResetClock/ResetClock";
import { getQuestTaskHref } from "feature/user/store/dailyQuest.routes";
import { selectDailyQuest, selectIsUserSnapshot } from "feature/user/store/userSlice";
import {
  claimQuestRewardAction,
  DAILY_QUEST_FAME_REWARD,
  DAILY_QUEST_POINTS_REWARD,
  ensureQuestForToday,
} from "feature/user/store/userSlice.questActions";
import { useTranslation } from "hooks/useTranslation";
import { Check, ChevronRight, Clock, Gift } from "lucide-react";
import Router from "next/router";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { DailyQuestTask } from "types/api.types";
import { formatTimeLeft, getLocalDayEnd } from "utils/gameLogic/resetSchedule";

const DailyQuestSkeleton = () => {
  const { t } = useTranslation("dashboard");
  return (
    <Card className='flex flex-col gap-7 p-5 sm:p-6'>
      <div className='flex flex-col gap-4'>
        <h3 className='text-base font-semibold text-zinc-100'>
          {t("daily_quests.title")}
        </h3>
        <div className='h-11 animate-pulse rounded-lg bg-white/[0.06]' />
      </div>
      <div className='flex animate-pulse flex-col gap-5'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='flex items-center gap-3.5'>
            <div className='h-6 w-6 shrink-0 rounded-full bg-white/[0.08]' />
            <div className='flex-1 space-y-2'>
              <div className='h-3 w-40 rounded bg-white/[0.08]' />
              <div className='h-3.5 rounded-full bg-white/[0.06]' />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const progressPercent = (task: DailyQuestTask) =>
  Math.min(100, (task.progress / Math.max(1, task.target)) * 100);

/** The set's reward, in the colours of the two currencies it pays out. */
const RewardAmounts = ({ plain = false }: { plain?: boolean }) => (
  <span className='flex items-center gap-2.5 font-bold tabular-nums'>
    <span
      className={cn("flex items-center gap-1", !plain && "text-cyan-400")}>
      +{DAILY_QUEST_POINTS_REWARD}
      <img
        src='/images/tokens/pick.png'
        alt='points'
        className='h-[18px] w-[18px] object-contain'
      />
    </span>
    <span
      className={cn("flex items-center gap-1", !plain && "text-amber-400")}>
      +{DAILY_QUEST_FAME_REWARD}
      <img
        src='/images/tokens/coin.png'
        alt='fame'
        className='h-[18px] w-[18px] object-contain'
      />
    </span>
  </span>
);

const DoneMark = () => (
  <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-emerald-950'>
    <Check size={14} strokeWidth={3.5} aria-hidden />
  </span>
);

export const DailyQuestWidget = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();
  const dailyQuest = useAppSelector(selectDailyQuest);
  // The saved copy shows the last quest it knew; drawing a new set on top of it
  // would only be replaced (or merged) when the real profile lands.
  const isUserSnapshot = useAppSelector(selectIsUserSnapshot);
  // The quest rolls over at the player's own midnight, not the server's.
  const now = useClientNow();

  // Only rolls the quest over when it is missing or from an earlier day.
  // useAuthSync already drew and synced it at login, and useDailyQuestSync
  // pulls other devices' progress on focus; re-initializing on every visit
  // cost a Firestore transaction each time the dashboard opened.
  useEffect(() => {
    if (isUserSnapshot) return;
    dispatch(ensureQuestForToday());
  }, [dispatch, isUserSnapshot]);

  if (!dailyQuest) return <DailyQuestSkeleton />;

  const total = dailyQuest.tasks.length;
  const done = dailyQuest.tasks.filter((task) => task.isCompleted).length;
  const allCompleted = done === total;
  const isClaimed = dailyQuest.isRewardClaimed;
  const timeLeft = now
    ? formatTimeLeft(getLocalDayEnd(now) - now.getTime())
    : null;

  const handleClaim = () => {
    if (allCompleted && !isClaimed) {
      dispatch(claimQuestRewardAction());
    }
  };

  const openTask = (task: DailyQuestTask) => {
    Router.push(getQuestTaskHref(task));
  };

  const taskLabel = (task: DailyQuestTask) =>
    task.type === "practice_specific_exercise"
      ? t("daily_quests.tasks.practice_specific_exercise", {
          exercise: task.title.replace(/^Practice: /, ""),
        })
      : t(`daily_quests.tasks.${task.type}`, task.title);

  const header = (
    <div className='flex items-center justify-between gap-3'>
      <h3 className='text-base font-semibold text-zinc-100'>
        {t("daily_quests.title")}
      </h3>
      {timeLeft && (
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 text-[13px] tabular-nums",
            isClaimed
              ? "font-medium text-zinc-400"
              : "font-semibold text-orange-400",
          )}>
          <Clock size={14} strokeWidth={2.5} aria-hidden />
          {isClaimed
            ? t("daily_quests.new_in", { time: timeLeft })
            : t("daily_quests.time_left", { time: timeLeft })}
        </span>
      )}
    </div>
  );

  // Claimed: nothing left to do today, so the card folds down to a receipt.
  if (isClaimed) {
    return (
      <Card className='flex flex-col gap-7 p-5 sm:p-6'>
        <div className='flex flex-col gap-4'>
          {header}
          <div className='flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-lg bg-emerald-500/10 px-4 py-3.5 text-sm'>
            <span className='flex items-center gap-3 font-semibold text-emerald-400'>
              <DoneMark />
              {t("daily_quests.all_done")}
            </span>
            <RewardAmounts />
          </div>
        </div>
        <ul className='flex flex-col gap-4'>
          {dailyQuest.tasks.map((task) => (
            <li
              key={task.id}
              className='flex items-center gap-3 text-sm font-medium text-zinc-400'>
              <Check
                size={16}
                strokeWidth={3}
                className='shrink-0 text-emerald-400'
                aria-hidden
              />
              {taskLabel(task)}
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <Card className='flex flex-col gap-6 p-5 sm:p-6'>
      <div className='flex flex-col gap-4'>
        {header}

        {/* The reward is for the whole set, so it sits under the title rather
            than on any one quest. The rows below already show the progress. */}
        {allCompleted ? (
          <Button
            onClick={handleClaim}
            className='h-12 w-full gap-3 border-b-amber-700 bg-amber-400 text-[15px] font-bold text-zinc-950 hover:bg-amber-300'>
            <Gift aria-hidden />
            {t("daily_quests.claim_reward")}
            <RewardAmounts plain />
          </Button>
        ) : (
          <div className='flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm'>
            <span className='text-zinc-200'>
              {t("daily_quests.reward_hint", { total })}
            </span>
            <RewardAmounts />
          </div>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        {dailyQuest.tasks.map((task) => {
          const body = (
            <span className='flex min-w-0 flex-col gap-2'>
              <span className='flex items-baseline justify-between gap-3'>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    task.isCompleted ? "text-zinc-400" : "text-zinc-100",
                  )}>
                  {taskLabel(task)}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[13px] font-semibold tabular-nums",
                    task.isCompleted
                      ? "text-emerald-400"
                      : task.progress > 0
                        ? "text-zinc-100"
                        : "text-zinc-400",
                  )}>
                  {task.progress} / {task.target}
                </span>
              </span>
              <span className='block h-3.5 overflow-hidden rounded-full bg-zinc-700/50'>
                <span
                  className={cn(
                    "block h-full rounded-full transition-[width] duration-slow",
                    task.isCompleted
                      ? "bg-emerald-500"
                      : "bar-shine bg-cyan-400",
                  )}
                  style={{ width: `${progressPercent(task)}%` }}
                />
              </span>
            </span>
          );

          const rowClass =
            "grid grid-cols-[24px_minmax(0,1fr)_16px] items-center gap-x-3.5 rounded-lg px-2 py-2 -mx-2";

          return task.isCompleted ? (
            <div key={task.id} className={rowClass}>
              <DoneMark />
              {body}
            </div>
          ) : (
            <button
              key={task.id}
              type='button'
              onClick={() => openTask(task)}
              className={cn(
                rowClass,
                "text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:bg-zinc-800/40",
              )}>
              <span className='h-6 w-6 rounded-full ring-2 ring-inset ring-zinc-600' />
              {body}
              <ChevronRight
                size={16}
                strokeWidth={2.5}
                className='text-zinc-400'
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </Card>
  );
};
