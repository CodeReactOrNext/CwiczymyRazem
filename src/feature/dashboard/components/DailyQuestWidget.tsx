import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { useClientNow } from "components/ResetClock/ResetClock";
import { getQuestTaskHref } from "feature/user/store/dailyQuest.routes";
import {
  selectDailyQuest,
  selectIsUserSnapshot,
} from "feature/user/store/userSlice";
import {
  claimQuestRewardAction,
  DAILY_QUEST_FAME_REWARD,
  DAILY_QUEST_POINTS_REWARD,
  ensureQuestForToday,
  rerollQuestTaskAction,
} from "feature/user/store/userSlice.questActions";
import { useTranslation } from "hooks/useTranslation";
import { Check, ChevronRight, Clock, Gift, RefreshCw } from "lucide-react";
import Router from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { DailyQuestTask } from "types/api.types";
import { formatTimeLeft, getLocalDayEnd } from "utils/gameLogic/resetSchedule";

const DailyQuestSkeleton = () => {
  const { t } = useTranslation("dashboard");
  return (
    <Card className='flex flex-col gap-6 p-5 sm:p-6'>
      <h3 className='text-base font-semibold text-zinc-100'>
        {t("daily_quests.title")}
      </h3>
      <div className='flex flex-col gap-6 py-2.5' aria-busy='true'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='flex items-center gap-3.5'>
            <Skeleton className='h-6 w-6 shrink-0 rounded-full' />
            <Skeleton className='h-3 w-48' />
          </div>
        ))}
      </div>
      <Skeleton className='h-12 rounded-lg' />
    </Card>
  );
};

/** The clock turns orange only for the last hours of the day. */
const HURRY_MS = 3 * 60 * 60 * 1000;

const progressPercent = (task: DailyQuestTask) =>
  Math.min(100, (task.progress / Math.max(1, task.target)) * 100);

/** The set's reward, in the colours of the two currencies it pays out. */
const RewardAmounts = ({ plain = false }: { plain?: boolean }) => (
  <span className='flex items-center gap-2.5 font-bold tabular-nums'>
    <span className={cn("flex items-center gap-1", !plain && "text-cyan-400")}>
      +{DAILY_QUEST_POINTS_REWARD}
      <img
        src='/images/tokens/pick.png'
        alt='points'
        className='h-[18px] w-[18px] object-contain'
      />
    </span>
    <span className={cn("flex items-center gap-1", !plain && "text-amber-400")}>
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
  // One swap a day, so a single key in the header arms it and the next quest
  // tapped is the one swapped, instead of a swap key on every row.
  const [swapMode, setSwapMode] = useState(false);

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
  const msLeft = now ? getLocalDayEnd(now) - now.getTime() : null;
  const timeLeft = msLeft !== null ? formatTimeLeft(msLeft) : null;

  const handleClaim = () => {
    if (allCompleted && !isClaimed) {
      dispatch(claimQuestRewardAction());
    }
  };

  const openTask = (task: DailyQuestTask) => {
    Router.push(getQuestTaskHref(task));
  };

  const taskLabel = (task: DailyQuestTask) => {
    if (task.type === "practice_specific_exercise") {
      return t("daily_quests.tasks.practice_specific_exercise", {
        exercise: task.title.replace(/^Practice: /, ""),
      });
    }
    // Some tool quests come in more than one size ("Play 2 items from your
    // Rotation"), so the target picks the plural form.
    const key = `daily_quests.tasks.${task.type}`;
    const label = t(key, { count: task.target });
    return label === key ? task.title : label;
  };

  // Only the slots worth a word: a tool the player uses needs no explaining.
  const slotNote = (task: DailyQuestTask) =>
    task.slot === "discover"
      ? t("daily_quests.slot_discover")
      : task.slot === "comeback"
        ? t("daily_quests.slot_comeback")
        : null;

  const canReroll = !dailyQuest.rerolled && !allCompleted;
  const isSwapping = swapMode && canReroll;
  // The clock stays quiet most of the day and only warns in the last hours.
  const isRunningOut = msLeft !== null && msLeft < HURRY_MS;

  const header = (
    <div className='flex items-center justify-between gap-3'>
      <h3 className='flex items-baseline gap-2.5 text-base font-semibold text-zinc-100'>
        {t("daily_quests.title")}
        {!isClaimed && (
          <span className='text-[13px] font-semibold tabular-nums text-zinc-500'>
            {done} / {total}
          </span>
        )}
      </h3>
      <div className='flex shrink-0 items-center gap-3'>
        {timeLeft && (
          <span
            className={cn(
              "flex items-center gap-1.5 text-[13px] tabular-nums",
              isRunningOut && !isClaimed
                ? "font-semibold text-orange-400"
                : "font-medium text-zinc-400",
            )}>
            <Clock size={14} strokeWidth={2.5} aria-hidden />
            {isClaimed
              ? t("daily_quests.new_in", { time: timeLeft })
              : t("daily_quests.time_left", { time: timeLeft })}
          </span>
        )}
        {!isClaimed && canReroll && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setSwapMode((on) => !on)}
            aria-pressed={isSwapping}
            title={t("daily_quests.reroll_hint")}
            className={cn(
              isSwapping &&
                "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200",
            )}>
            <RefreshCw aria-hidden />
            {isSwapping
              ? t("daily_quests.swap_cancel")
              : t("daily_quests.swap")}
          </Button>
        )}
      </div>
    </div>
  );

  // Claimed: nothing left to do today, so the card folds down to a receipt.
  if (isClaimed) {
    return (
      <Card className='flex flex-col gap-6 p-5 sm:p-6'>
        {header}
        <div className='flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-lg bg-emerald-500/10 px-4 py-3.5 text-sm'>
          <span className='flex items-center gap-3 font-semibold text-emerald-400'>
            <DoneMark />
            {t("daily_quests.all_done")}
          </span>
          <RewardAmounts />
        </div>
      </Card>
    );
  }

  const swapTask = (task: DailyQuestTask) => {
    setSwapMode(false);
    dispatch(rerollQuestTaskAction(task.id));
  };

  return (
    <Card className='flex flex-col gap-6 p-5 sm:p-6'>
      {header}

      {isSwapping && (
        <p className='-mt-2 text-[13px] text-zinc-400'>
          {t("daily_quests.swap_pick")}
        </p>
      )}

      <div className='flex flex-col gap-1.5'>
        {dailyQuest.tasks.map((task) => {
          // A one-off quest is done or not: the circle already says so, and a
          // bar or "0 / 1" beside it only repeated it.
          const isCounted = task.target > 1;
          const body = (
            <span className='flex min-w-0 flex-col gap-2'>
              <span className='flex items-baseline justify-between gap-3'>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    task.isCompleted ? "text-zinc-500" : "text-zinc-100",
                  )}>
                  {taskLabel(task)}
                  {!task.isCompleted && slotNote(task) && (
                    <span className='mt-0.5 block text-xs font-medium text-zinc-400'>
                      {slotNote(task)}
                    </span>
                  )}
                </span>
                {isCounted && (
                  <span
                    className={cn(
                      "shrink-0 text-[13px] font-semibold tabular-nums",
                      task.isCompleted
                        ? "text-emerald-400"
                        : task.progress > 0
                          ? "text-zinc-100"
                          : "text-zinc-500",
                    )}>
                    {task.progress} / {task.target}
                  </span>
                )}
              </span>
              {isCounted && !task.isCompleted && (
                <span className='block h-2.5 overflow-hidden rounded-full bg-zinc-700/50'>
                  <span
                    className={cn(
                      "block h-full rounded-full bg-cyan-400 transition-[width] duration-slow",
                      task.progress > 0 && "bar-shine",
                    )}
                    style={{ width: `${progressPercent(task)}%` }}
                  />
                </span>
              )}
            </span>
          );

          const rowClass =
            "-mx-2 grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3.5 rounded-lg px-2 py-2.5";

          if (task.isCompleted) {
            return (
              <div key={task.id} className={rowClass}>
                <DoneMark />
                {body}
                <span />
              </div>
            );
          }

          return (
            <button
              key={task.id}
              type='button'
              onClick={() => (isSwapping ? swapTask(task) : openTask(task))}
              aria-label={isSwapping ? t("daily_quests.reroll") : undefined}
              className={cn(
                rowClass,
                "text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500",
                isSwapping
                  ? "bg-zinc-800/40 hover:bg-zinc-700/50"
                  : "hover:bg-zinc-800/40",
              )}>
              <span className='h-6 w-6 rounded-full ring-2 ring-inset ring-zinc-600' />
              {body}
              {isSwapping ? (
                <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700 text-zinc-100'>
                  <RefreshCw size={16} aria-hidden />
                </span>
              ) : (
                <ChevronRight
                  size={16}
                  strokeWidth={2.5}
                  className='text-zinc-500'
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {/* The reward is for the whole set, so it closes the list: first the
          quests, then what they pay. The claim key takes the same spot. */}
      {allCompleted ? (
        <Button
          size='xl'
          onClick={handleClaim}
          className='w-full gap-3 border-b-amber-700 bg-amber-400 text-zinc-950 hover:bg-amber-300'>
          <Gift aria-hidden />
          {t("daily_quests.claim_reward")}
          <RewardAmounts plain />
        </Button>
      ) : (
        <div className='flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2 rounded-lg bg-zinc-800/50 px-4 py-3.5 text-sm'>
          <span className='font-medium text-zinc-300'>
            {t("daily_quests.reward_hint", { total })}
          </span>
          <RewardAmounts />
        </div>
      )}
    </Card>
  );
};
