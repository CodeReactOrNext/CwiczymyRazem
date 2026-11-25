import { useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { PAGE_CONTENT, PAGE_GUTTER } from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import {
  firebaseClaimLevel,
  firebaseGetPracticeLevels,
  firebasePurchaseLevel,
  type PracticeLevelsState,
} from "feature/aiSummary/services/practiceLevels.service";
import {
  computeProgressData, currentWeekDates, isoWeekKey, isSameDay,
  LEVELS, localDateStr, milestoneLockedAtLvl, MS_15,
  openingMilestoneIndex, PRACTICE_CATEGORIES,
} from "feature/aiSummary/utils/milestoneLogic";
import { MILESTONE_GREEN, MilestoneNode } from "feature/dashboard/components/widgets/MilestoneNode";
import { practiceLevelsQueryKey } from "feature/dashboard/hooks/useMilestoneProgress";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { useProgressTabs } from "feature/profile/hooks/useProgressTabs";
import {
  addFame,
  deductFame,
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { Interpolate } from "lib/i18n/Interpolate";
import type { Translate } from "lib/i18n/translate";
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight, Info,
  Lock, TrendingUp, Trophy, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";
import { useAppSelector } from "store/hooks";

// ─── helpers ──────────────────────────────────────────────────────────────────

// Compact hours format ("98 min" → "1h 38 min") matching the activity widget.
function fmtMin(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return rem > 0 ? `${h}h ${rem} min` : `${h}h`;
}

// Day colours for the week charts. Colour only where it means something:
// emerald = the day counted, orange = a running streak (as everywhere else in
// the app), a lighter track = the day being looked at. Tiers have no colour.
const SHORT_DAY   = "#71717a";                 // practised, but short of the goal
const STREAK      = "#fb923c";                 // orange-400
const STREAK_TINT = "rgba(249,115,22,0.16)";
const FULL_DAY    = "rgba(255,255,255,0.09)";  // all four categories covered

const dayTile = (shown: boolean, future: boolean) =>
  shown ? "rgba(255,255,255,0.07)" : future ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.035)";

const dayLabel = (shown: boolean, future: boolean) =>
  shown ? "#fafafa" : future ? "#52525b" : "#a1a1aa";

/** Level names and goals are catalogued by id in `milestones:levels`. */
const levelName = (t: Translate, level: { id: number; name: string }) =>
  t(`levels.${level.id}.name`, level.name);

/** Category labels, keyed the way `PRACTICE_CATEGORIES` keys them. */
const CAT_KEY: Record<string, string> = {
  tech: "technique",
  theory: "theory",
  hearing: "hearing",
  creat: "creativity",
};


// ─── Progress Level System ────────────────────────────────────────────────────
// Level defs + progress maths live in feature/aiSummary/utils/milestoneLogic so
// the sidebar "unclaimed reward" indicator shares the exact same rules.

// ─── PracticeProgressTracker ──────────────────────────────────────────────────
// The milestone map: one node per level joined by a trail that fills green as
// levels are reached. Tapping a node loads its goal into the card below.

function PracticeProgressTracker({
  logs, today, activeIdx, onPreviewChange, ownedSet, claimedSet, playerLvl,
}: {
  logs: FirebaseUserExceriseLog[];
  today: Date;
  activeIdx: number;
  onPreviewChange: (idx: number) => void;
  ownedSet: Set<number>;
  claimedSet: Set<number>;
  playerLvl: number;
}) {
  const { t } = useTranslation("milestones");
  const data = useMemo(() => computeProgressData(logs, today), [logs, today]);

  const levelStatuses = LEVELS.map(l => ({
    ...l,
    met:      l.isMet(data),
    progress: l.getProgress(data),
  }));

  const realNextIdx = levelStatuses.findIndex(s => !s.met);
  const metCount    = levelStatuses.filter(s => s.met).length;
  // The bubble sits over the goal the week is heading for — the first one not
  // met yet, and only while it is the player's to work on (owned, not shut).
  const bubbleIdx = realNextIdx !== -1 && ownedSet.has(levelStatuses[realNextIdx].id)
    ? realNextIdx
    : -1;
  const bubbleLeft = bubbleIdx === -1
    ? 0
    : levelStatuses[bubbleIdx].progress.max - levelStatuses[bubbleIdx].progress.value;

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // keep the focused level centered in the horizontal scroll strip
  useEffect(() => {
    const node = activeRef.current;
    const container = scrollRef.current;
    if (!node || !container) return;
    const target = node.offsetLeft - container.clientWidth / 2 + node.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeIdx]);

  const GREEN = MILESTONE_GREEN; // "reached" emerald, shared by discs, trail and bars
  const NODE = 56;             // node diameter
  const CENTER = NODE / 2;     // vertical centre → trail height

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg bg-zinc-800/40 px-4 pb-6 pt-2 sm:px-6 sm:pb-7 sm:pt-3">
      {/* arrows flank the strip like a carousel, aligned to the node centres */}
      <div className="flex items-start gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => onPreviewChange(Math.max(0, activeIdx - 1))}
          disabled={activeIdx === 0}
          aria-label={t("page.prev_level")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "mt-[50px] shrink-0 text-zinc-400 disabled:opacity-25")}
        >
          <ChevronLeft strokeWidth={2.5} />
        </button>

        {/* milestone nodes */}
        <div
          ref={scrollRef}
          className="flex flex-1 items-start overflow-x-auto no-scrollbar snap-x snap-mandatory pt-10 pb-1 sm:snap-none sm:overflow-x-visible"
        >
        {levelStatuses.map((level, idx) => {
          const isOwned     = ownedSet.has(level.id);
          const isClaimed   = claimedSet.has(level.id);
          const isCurrent   = idx === activeIdx;
          // Two reasons a tier can be shut: it has not been bought, or the
          // account is not high enough to buy it. The strip has room for one
          // padlock, not two stories — the card below tells them apart.
          const lockedLvl   = milestoneLockedAtLvl(level, playerLvl, isOwned);
          const showLock    = !isOwned && (level.cost > 0 || lockedLvl != null);
          const prevMet     = idx > 0 && levelStatuses[idx - 1].met;

          return (
            <button
              key={level.id}
              ref={isCurrent ? activeRef : undefined}
              type="button"
              onClick={() => onPreviewChange(idx)}
              aria-label={`${levelName(t, level)} — ${level.met ? t("page.reached_lc") : showLock ? t("page.locked_lc") : t("page.in_progress_lc")}`}
              className="group relative flex w-[80px] shrink-0 snap-center flex-col items-center gap-3 outline-none sm:w-auto sm:flex-1 sm:min-w-0 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
            >
              {/* trail segment linking this node to the previous one */}
              {idx > 0 && (
                <span
                  aria-hidden
                  className="absolute left-[-50%] right-1/2 h-1.5 rounded-full transition-colors"
                  style={{ top: CENTER - 3, backgroundColor: prevMet ? GREEN : "#3f3f46" }}
                />
              )}

              {/* "1 more day" over the goal the week is heading for — the
                  strip's one moving part, so the eye lands where to practise */}
              {idx === bubbleIdx && (
                <m.span
                  aria-hidden
                  className="pointer-events-none absolute -top-9 z-20 whitespace-nowrap rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-950"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  {t("page.days_left", { count: bubbleLeft })}
                  <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-100" />
                </m.span>
              )}

              {/* node — a round key: amber gift = Fame waiting, green tick = collected */}
              <div className="relative z-10">
                <MilestoneNode
                  status={{
                    met: level.met,
                    owned: isOwned,
                    claimed: isClaimed,
                    cost: level.cost,
                    lockedAtLvl: lockedLvl ?? null,
                    Icon: level.Icon,
                    progress: level.progress,
                  }}
                  isCurrent={isCurrent}
                  selected={isCurrent}
                  pressable
                />
              </div>

              {/* label */}
              <span
                className="w-full max-w-[76px] truncate px-0.5 text-center text-xs font-semibold leading-none"
                style={{ color: isCurrent ? "#fafafa" : level.met ? "#d4d4d8" : "#8e8e98" }}
                title={levelName(t, level)}
              >
                {t(`levels.${level.id}.short`, level.short ?? levelName(t, level).split(" ")[0])}
              </span>
            </button>
          );
        })}
        </div>

        <button
          type="button"
          onClick={() => onPreviewChange(Math.min(LEVELS.length - 1, activeIdx + 1))}
          disabled={activeIdx === LEVELS.length - 1}
          aria-label={t("page.next_level")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "mt-[50px] shrink-0 text-zinc-400 disabled:opacity-25")}
        >
          <ChevronRight strokeWidth={2.5} />
        </button>
      </div>

      {/* The keys read on their own (tick, gift, ring, padlock), so a legend
          only repeated them — the count is the one thing they don't say. */}
      <p className="text-right text-sm font-medium tabular-nums text-zinc-400">
        {t("page.reached_of", { done: metCount, total: LEVELS.length })}
      </p>
    </div>
  );
}

// ─── LevelGoalCard ────────────────────────────────────────────────────────────

// Shares the one category theme milestoneLogic defines, so the day grids here
// and the milestone cards on Home cannot drift apart.
const CATS = PRACTICE_CATEGORIES;

function buildByDate(logs: FirebaseUserExceriseLog[]) {
  const map = new Map<string, { sumTime: number; tech: number; theory: number; hearing: number; creat: number }>();
  for (const log of logs) {
    const key = localDateStr(new Date(log.reportDate.seconds * 1000));
    const ex  = map.get(key) ?? { sumTime: 0, tech: 0, theory: 0, hearing: 0, creat: 0 };
    map.set(key, {
      sumTime: ex.sumTime + (log.timeSumary?.sumTime        ?? 0),
      tech:    ex.tech    + (log.timeSumary?.techniqueTime  ?? 0),
      theory:  ex.theory  + (log.timeSumary?.theoryTime     ?? 0),
      hearing: ex.hearing + (log.timeSumary?.hearingTime    ?? 0),
      creat:   ex.creat   + (log.timeSumary?.creativityTime ?? 0),
    });
  }
  return map;
}

function LevelGoalCard({
  logs, today, displayDate, onSelectDay, onPeekDay, activeIdx,
  isOwned, isClaimedThisWeek, fame, busy, onPurchase, onClaim, playerLvl,
}: {
  logs: FirebaseUserExceriseLog[];
  today: Date;
  displayDate: Date;
  onSelectDay: (d: Date) => void;
  onPeekDay: (d: Date | null) => void;
  activeIdx: number;
  isOwned: boolean;
  isClaimedThisWeek: boolean;
  fame: number;
  busy: boolean;
  onPurchase: (levelId: number) => void;
  onClaim: (levelId: number) => void;
  playerLvl: number;
}) {
  const { t } = useTranslation(["milestones", "common"]);
  const intl = useIntlLocale() ?? "en-US";
  const catLabel = (cat: { k: string; label: string }) =>
    t(`common:categories.${CAT_KEY[cat.k]}`, cat.label);
  const progressData  = useMemo(() => computeProgressData(logs, today), [logs, today]);
  const levelStatuses = useMemo(
    () => LEVELS.map(l => ({ ...l, met: l.isMet(progressData), progress: l.getProgress(progressData) })),
    [progressData]
  );
  const nextLevel   = levelStatuses[activeIdx];
  const byDate      = useMemo(() => buildByDate(logs), [logs]);

  if (!nextLevel) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-zinc-800/40 px-5 py-4">
        <Trophy size={20} className="text-amber-400" />
        <p className="text-sm font-semibold text-zinc-200">{t("page.all_unlocked")}</p>
      </div>
    );
  }

  const { value, max } = nextLevel.progress;

  const levelType =
    nextLevel.id === 6                ? "week-cats"     as const :
    [7, 8, 9].includes(nextLevel.id)  ? "streak-cats"   as const :
    [3, 5].includes(nextLevel.id)     ? "streak-simple" as const :
    "week-bars" as const;

  const weekDays = currentWeekDates(today);

  const streakKeys = (() => {
    const keys = new Set<string>();
    if (levelType !== "streak-simple" && levelType !== "streak-cats") return keys;
    const needAllCats = [7, 8, 9].includes(nextLevel.id);
    const pred = (k: string) => {
      const d = byDate.get(k);
      if (!d) return false;
      return needAllCats
        ? d.tech >= MS_15 && d.theory >= MS_15 && d.hearing >= MS_15 && d.creat >= MS_15
        : d.sumTime >= MS_15;
    };
    const weekStart = weekDays[0];   // Monday 00:00 — streak resets each week
    const cursor = new Date(today);
    cursor.setHours(0, 0, 0, 0);
    if (!pred(localDateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
    for (let i = 0; i < 30; i++) {
      if (cursor < weekStart) break;
      const key = localDateStr(cursor);
      if (!pred(key)) break;
      keys.add(key);
      cursor.setDate(cursor.getDate() - 1);
    }
    return keys;
  })();

  // week-bars only — per-level daily minutes goal (Rising Habit needs 20, others 15)
  const dayGoalMin = nextLevel.dayGoalMin ?? 15;
  const dayGoalMs  = dayGoalMin * 60 * 1000;
  const dayBars = weekDays.map(day => {
    const key     = localDateStr(day);
    const d       = byDate.get(key);
    const minutes = Math.round((d?.sumTime ?? 0) / 60000);
    const ok      = (d?.sumTime ?? 0) >= dayGoalMs;
    const isToday  = isSameDay(day, today);
    const isFuture = day.getTime() > today.getTime();
    return {
      label: day.toLocaleDateString(intl, { weekday: "short" }),
      minutes, ok, isToday, isFuture,
      isSelected: isSameDay(day, displayDate),
    };
  });

  const isMet         = nextLevel.met;
  // The account level comes first and the price second, so a tier out of reach
  // never shows a price the player could pay but a button that would refuse.
  const lockedLvl     = milestoneLockedAtLvl(nextLevel, playerLvl, isOwned);
  const isLocked      = !isOwned && (nextLevel.cost > 0 || lockedLvl != null);
  const canAfford     = fame >= nextLevel.cost;
  const canClaim      = isOwned && isMet && !isClaimedThisWeek;

  const btnBase = "flex w-full items-center justify-center gap-2.5 rounded-lg px-6 py-3.5 text-base font-bold sm:w-auto";

  let actionButton: React.ReactNode = null;
  if (lockedLvl != null) {
    // Not a disabled button. There is nothing here to press yet — the way past
    // this is to go and practise — so it is stated rather than offered, and the
    // price waits its turn underneath.
    actionButton = (
      <div className="flex flex-col items-center gap-2">
        <div
          className={`${btnBase} cursor-default`}
          style={{ backgroundColor: "#27272a", color: "#a1a1aa" }}
        >
          <Lock size={18} />
          <span>{t("page.unlocks_at", { lvl: lockedLvl })}</span>
        </div>
        <p className="text-center text-xs leading-snug text-zinc-500">
          {nextLevel.cost > 0
            ? t("page.you_are_level_cost", { lvl: playerLvl, cost: nextLevel.cost })
            : t("page.you_are_level", { lvl: playerLvl })}
        </p>
      </div>
    );
  } else if (isLocked) {
    actionButton = (
      <Button
        size="xl"
        onClick={() => onPurchase(nextLevel.id)}
        disabled={busy || !canAfford}
        className={cn(
          "w-full sm:w-auto",
          !canAfford && "border-b-zinc-900 bg-zinc-800 text-zinc-500",
        )}
      >
        <Lock />
        <span>{t("page.unlock_once")}</span>
        <img src="/images/tokens/coin.png" alt="Fame" className="h-5 w-5 object-contain" />
        <span className="tabular-nums">{nextLevel.cost}</span>
        {!canAfford && (
          <span className="text-xs font-medium text-zinc-500">
            {t("page.need_more", { count: nextLevel.cost - fame })}
          </span>
        )}
      </Button>
    );
  } else if (canClaim) {
    // goal reached → reward unlocked, claimable. Amber like every Fame claim
    // (the Home card's included): the colour says "reward", not "done".
    actionButton = (
      <Button
        size="xl"
        onClick={() => onClaim(nextLevel.id)}
        disabled={busy}
        className="w-full border-b-amber-700 bg-amber-500 text-amber-950 hover:bg-amber-400 focus-visible:ring-amber-300 sm:w-auto"
      >
        <span>{t("page.claim_reward")}</span>
        <img src="/images/tokens/coin.png" alt="Fame" className="h-5 w-5 object-contain" />
        <span className="tabular-nums">+{nextLevel.reward}</span>
      </Button>
    );
  } else if (isOwned && isClaimedThisWeek) {
    // nothing left to do this week — a quiet status line, not a fake button
    actionButton = (
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        <span>
          <Interpolate
            text={t("page.claimed_line")}
            values={{
              reward: (
                <span className="font-semibold text-zinc-300">
                  {t("card.reward", { reward: nextLevel.reward })}
                </span>
              ),
            }}
          />
        </span>
      </p>
    );
  } else if (isOwned && !isMet) {
    // reward preview stays plain text; it only becomes a button once claimable
    actionButton = (
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        <img src="/images/tokens/coin.png" alt="Fame" className="h-[18px] w-[18px] shrink-0 object-contain" />
        <span>
          <Interpolate
            text={t("page.reward_line")}
            values={{
              reward: (
                <span className="font-semibold text-amber-400">
                  {t("card.reward", { reward: nextLevel.reward })}
                </span>
              ),
            }}
          />
        </span>
      </p>
    );
  }

  // The same key the strip and the Home card draw, so a tier looks like one
  // thing wherever it shows up; the goal itself is the headline next to it.
  const isCurrent = !isMet && !isLocked;
  const percent   = Math.min(1, max > 0 ? value / max : 0) * 100;

  return (
    <div className="rounded-lg bg-zinc-800/40 p-5 sm:p-7 space-y-6">
      <div className="flex items-center gap-4">
        <MilestoneNode
          status={{
            met: isMet,
            owned: isOwned,
            claimed: isClaimedThisWeek,
            cost: nextLevel.cost,
            lockedAtLvl: lockedLvl ?? null,
            Icon: nextLevel.Icon,
            progress: nextLevel.progress,
          }}
          isCurrent={isCurrent}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-zinc-400">
              {levelName(t, nextLevel)} · {isMet ? t("page.goal_complete") : t("page.goal_this_week")}
            </p>
            {isOwned && isClaimedThisWeek && (
              <Chip color='emerald' size='sm'>
                {t("card.claimed")}
              </Chip>
            )}
            {isOwned && !isClaimedThisWeek && isMet && (
              <Chip color='amber' size='sm'>
                {t("page.claim")}
              </Chip>
            )}
          </div>
          <h2 className="mt-1 text-lg font-semibold leading-snug text-zinc-50 sm:text-xl">
            {t(`levels.${nextLevel.id}.req`, nextLevel.req)}
          </h2>
        </div>

        <div className="text-right shrink-0">
          {isLocked ? (
            <>
              <p className="flex items-center justify-end gap-1 text-xs font-semibold text-zinc-500 line-through">
                <img src="/images/tokens/coin.png" alt="" className="h-3 w-3 object-contain opacity-50" />
                <span className="tabular-nums">
                  {t("page.cost_once", { cost: nextLevel.cost })}
                </span>
              </p>
              <p className="mt-1 flex items-center justify-end gap-1 leading-none text-amber-400">
                <img src="/images/tokens/coin.png" alt="Fame" className="h-5 w-5 object-contain" />
                <span className="font-teko text-3xl font-semibold tabular-nums">+{nextLevel.reward}</span>
                <span className="text-sm text-zinc-500">{t("page.per_week")}</span>
              </p>
            </>
          ) : (
            // Big numbers are Teko across the game (duels, bosses, ranks).
            <p className="font-teko font-semibold leading-[0.8] tabular-nums">
              <span className="text-5xl text-zinc-50">{value}</span>
              <span className="text-3xl text-zinc-500">/{max}</span>
            </p>
          )}
        </div>
      </div>

      {/* Reward surfaced right under the header so the claim is impossible to
          miss — the chart below is supporting detail, not the call-to-action. */}
      {!isLocked && (
        <div className="space-y-4 sm:pl-[72px]">
          {/* the week as one thick bar — the number in the corner, made visible */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={value}
            className="relative h-3 overflow-hidden rounded-full bg-zinc-800"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-[width] duration-slow ease-out"
              style={{ width: `${percent}%` }}
            />
            {value > 0 && (
              <div
                aria-hidden
                className="light-hide absolute left-1.5 top-[3px] h-[3px] rounded-full bg-white/30"
                style={{ width: `calc(${percent}% - 12px)` }}
              />
            )}
          </div>
          {actionButton && (
            <div className="[&>button]:w-full">
              {actionButton}
            </div>
          )}
        </div>
      )}

      {/* ── week-bars (levels 1,2,4) ── */}
      {!isLocked && levelType === "week-bars" && (() => {
        const maxMin     = Math.max(dayGoalMin * 2, ...dayBars.map(d => d.minutes));
        const CHART_H    = 160;          // bar track height
        const LABEL_AREA = 40;           // weekday + today's dot below
        const VALUE_H    = 24;           // minutes value above bar
        const GOAL_PX    = (dayGoalMin / maxMin) * CHART_H;
        return (
          <div className="pt-2">
            <div className="relative">
            {/* the daily goal — a faint solid rule, labelled at its end */}
            <div
              className="pointer-events-none absolute inset-x-0 z-10"
              style={{ bottom: `${LABEL_AREA + GOAL_PX - 1}px` }}
            >
              <div className="h-0.5 rounded-full bg-zinc-400/25" />
              <span className="absolute bottom-1.5 right-0 text-xs font-medium text-zinc-400">
                {t("page.min_goal", { min: dayGoalMin })}
              </span>
            </div>
            <div className="flex items-end gap-1.5 sm:gap-2.5">
              {dayBars.map((entry, i) => {
                const day      = weekDays[i];
                // Nothing logged stays an empty track — no red stub, no cross.
                const heightPx = entry.minutes > 0
                  ? Math.max((entry.minutes / maxMin) * CHART_H, 6)
                  : 0;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => onPeekDay(day)}
                    onMouseLeave={() => onPeekDay(null)}
                    onClick={() => onSelectDay(day)}
                    className="group flex flex-1 flex-col items-center justify-end cursor-pointer select-none touch-manipulation outline-none rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
                  >
                    {/* minutes above the bar — the unit lives on the goal line */}
                    <span
                      className="text-xs sm:text-sm font-semibold tabular-nums leading-none"
                      style={{ height: VALUE_H, color: entry.ok ? "#34d399" : "#a1a1aa" }}
                    >
                      {entry.minutes > 0 ? entry.minutes : ""}
                    </span>
                    {/* bar + track; the picked day is a lighter track, not an outline */}
                    <div
                      className="flex w-full max-w-[56px] items-end justify-center rounded-lg transition-colors"
                      style={{ height: CHART_H, backgroundColor: dayTile(entry.isSelected, entry.isFuture) }}
                    >
                      <div
                        className="w-full rounded-b rounded-t-md transition-[height,filter] duration-slow ease-out group-hover:brightness-125"
                        style={{
                          height: heightPx,
                          backgroundColor: entry.ok ? MILESTONE_GREEN : SHORT_DAY,
                        }}
                      />
                    </div>
                    {/* weekday, today dotted */}
                    <div className="flex flex-col items-center gap-1.5 pt-2.5" style={{ height: LABEL_AREA }}>
                      <span
                        className="text-xs sm:text-sm font-medium leading-none transition-colors"
                        style={{ color: dayLabel(entry.isSelected, entry.isFuture) }}
                      >
                        <span className="sm:hidden">{day.toLocaleDateString(intl, { weekday: "narrow" })}</span>
                        <span className="hidden sm:inline">{entry.label}</span>
                      </span>
                      {entry.isToday && <span aria-hidden className="h-1 w-1 rounded-full bg-zinc-50" />}
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
            <p className="mt-5 text-xs leading-snug text-zinc-400">
              <Interpolate
                text={t("page.bars_hint")}
                values={{
                  min: (
                    <span className="font-semibold text-zinc-300">
                      {t("page.min_plus", { min: dayGoalMin })}
                    </span>
                  ),
                }}
              />
            </p>
          </div>
        );
      })()}

      {/* ── streak-simple (levels 3,5) ── */}
      {!isLocked && levelType === "streak-simple" && (
        <div className="space-y-5 pt-2">
          <div className="flex gap-1.5 sm:gap-2">
            {weekDays.map((day, i) => {
              const key      = localDateStr(day);
              const stats    = byDate.get(key);
              const minutes  = Math.round((stats?.sumTime ?? 0) / 60000);
              const inStreak = streakKeys.has(key);
              const met      = (stats?.sumTime ?? 0) >= MS_15;
              const isToday  = isSameDay(day, today);
              const isShown  = isSameDay(day, displayDate);
              const isFuture = day.getTime() > today.getTime();
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => onPeekDay(day)}
                  onMouseLeave={() => onPeekDay(null)}
                  onClick={() => onSelectDay(day)}
                  className="group flex flex-1 flex-col items-center gap-2 cursor-pointer select-none touch-manipulation outline-none rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
                >
                  <div
                    className="relative flex w-full h-28 flex-col items-center justify-center gap-1 rounded-lg transition-[filter,background-color] group-hover:brightness-125"
                    style={{ backgroundColor: inStreak ? STREAK_TINT : dayTile(isShown, isFuture) }}
                  >
                    {/* the run carries on tomorrow — bridge the gap so it reads as one streak */}
                    {inStreak && i < 6 && streakKeys.has(localDateStr(weekDays[i + 1])) && (
                      <span
                        aria-hidden
                        className="absolute left-full top-1/2 h-5 w-1.5 -translate-y-1/2 sm:w-2"
                        style={{ backgroundColor: STREAK_TINT }}
                      />
                    )}
                    {/* a missed day stays empty — the gap in the tint is the break */}
                    {met ? (
                      <>
                        <Check size={28} strokeWidth={3} style={{ color: inStreak ? STREAK : "#a1a1aa" }} />
                        <span className="text-sm font-semibold tabular-nums" style={{ color: inStreak ? STREAK : "#a1a1aa" }}>
                          {fmtMin(minutes)}
                        </span>
                      </>
                    ) : minutes > 0 ? (
                      <span className="text-base font-semibold tabular-nums text-zinc-300">{fmtMin(minutes)}</span>
                    ) : null}
                  </div>
                  <span className="flex flex-col items-center gap-1.5">
                    <span className="text-sm font-medium leading-none transition-colors" style={{ color: dayLabel(isShown, isFuture) }}>
                      {day.toLocaleDateString(intl, { weekday: "narrow" })}
                    </span>
                    {isToday && <span aria-hidden className="h-1 w-1 rounded-full bg-zinc-50" />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-snug text-zinc-400">
            <Interpolate
              text={t("page.streak_hint")}
              values={{
                rule: (
                  <span className="font-semibold text-zinc-300">
                    {t("page.streak_rule")}
                  </span>
                ),
              }}
            />
          </p>
        </div>
      )}

      {/* ── week-cats (level 6) ── */}
      {!isLocked && levelType === "week-cats" && (
        <div className="space-y-5 pt-2">
          <div className="flex gap-1.5 sm:gap-2">
            {weekDays.map((day, i) => {
              const key      = localDateStr(day);
              const stats    = byDate.get(key);
              const met      = CATS.map(c => (stats?.[c.k] ?? 0) >= MS_15);
              const metCount = met.filter(Boolean).length;
              const allMet   = metCount === CATS.length;
              const isToday  = isSameDay(day, today);
              const isShown  = isSameDay(day, displayDate);
              const isFuture = day.getTime() > today.getTime();
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => onPeekDay(day)}
                  onMouseLeave={() => onPeekDay(null)}
                  onClick={() => onSelectDay(day)}
                  className="group flex flex-1 min-w-0 flex-col items-center gap-2 cursor-pointer select-none touch-manipulation outline-none rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
                >
                  <div
                    className="flex w-full flex-col items-center justify-center gap-2 sm:gap-2.5 rounded-lg py-3 px-0.5 sm:py-4 sm:px-1 transition-[filter,background-color] group-hover:brightness-125"
                    style={{
                      minHeight: 112,
                      backgroundColor: allMet ? FULL_DAY : dayTile(isShown, isFuture),
                    }}
                  >
                    {/* one dot per category — lit when that category hit 15+ min */}
                    <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                      {CATS.map((cat, ci) => (
                        <div
                          key={cat.k}
                          title={`${catLabel(cat)}${met[ci] ? " ✓" : ""}`}
                          className="h-3 w-3 sm:h-4 sm:w-4 rounded-full transition-all"
                          style={{
                            backgroundColor: met[ci] ? cat.color : "#3f3f46",
                          }}
                        />
                      ))}
                    </div>
                    {/* clear status: full check or n/4 */}
                    {allMet ? (
                      <Check size={20} strokeWidth={3} style={{ color: MILESTONE_GREEN }} />
                    ) : (
                      <span className="text-sm font-semibold tabular-nums text-zinc-400">{metCount}/4</span>
                    )}
                  </div>
                  <span className="flex flex-col items-center gap-1.5">
                    <span className="text-sm font-medium leading-none transition-colors" style={{ color: dayLabel(isShown, isFuture) }}>
                      {day.toLocaleDateString(intl, { weekday: "narrow" })}
                    </span>
                    {isToday && <span aria-hidden className="h-1 w-1 rounded-full bg-zinc-50" />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-snug text-zinc-400">
            <Interpolate
              text={t("page.cats_hint")}
              values={{
                rule: (
                  <span className="font-semibold text-zinc-300">
                    {t("page.cats_rule")}
                  </span>
                ),
              }}
            />
          </p>
          <div className="flex gap-3 flex-wrap">
            {CATS.map(cat => (
              <div key={cat.k} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs font-medium text-zinc-400">{catLabel(cat)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── streak-cats (levels 7,8,9) ── */}
      {!isLocked && levelType === "streak-cats" && (
        <div className="space-y-5 pt-2">
          <div className="flex gap-1.5 sm:gap-2">
            {weekDays.map((day, i) => {
              const key      = localDateStr(day);
              const stats    = byDate.get(key);
              const inStreak = streakKeys.has(key);
              const isToday  = isSameDay(day, today);
              const isShown  = isSameDay(day, displayDate);
              const isFuture = day.getTime() > today.getTime();
              const metCount = CATS.filter(c => (stats?.[c.k] ?? 0) >= MS_15).length;
              const allMet   = metCount === CATS.length;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => onPeekDay(day)}
                  onMouseLeave={() => onPeekDay(null)}
                  onClick={() => onSelectDay(day)}
                  className="group flex flex-1 min-w-0 flex-col items-center gap-2 cursor-pointer select-none touch-manipulation outline-none rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
                >
                  <div
                    className="relative flex w-full flex-col rounded-lg p-1.5 sm:p-2.5 transition-[filter,background-color] group-hover:brightness-125"
                    style={{
                      minHeight: 128,
                      backgroundColor: inStreak ? STREAK_TINT : allMet ? FULL_DAY : dayTile(isShown, isFuture),
                    }}
                  >
                    {inStreak && i < 6 && streakKeys.has(localDateStr(weekDays[i + 1])) && (
                      <span
                        aria-hidden
                        className="absolute left-full top-1/2 h-5 w-1.5 -translate-y-1/2 sm:w-2"
                        style={{ backgroundColor: STREAK_TINT }}
                      />
                    )}
                    {/* status: full check or how many of 4 categories done */}
                    <div className="flex h-6 items-center justify-center mb-2">
                      {allMet ? (
                        <Check size={22} strokeWidth={3} style={{ color: inStreak ? STREAK : MILESTONE_GREEN }} />
                      ) : (
                        <span className="text-sm font-semibold tabular-nums text-zinc-400">{metCount}/4</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-2">
                      {CATS.map(cat => {
                        const time = stats?.[cat.k] ?? 0;
                        const pct  = Math.min(time / MS_15, 1) * 100;
                        return (
                          <div key={cat.k} className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: cat.color,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <span className="flex flex-col items-center gap-1.5">
                    <span
                      className="text-xs sm:text-sm font-medium leading-none transition-colors"
                      style={{ color: dayLabel(isShown, isFuture) }}
                    >
                      <span className="sm:hidden">{day.toLocaleDateString(intl, { weekday: "narrow" })}</span>
                      <span className="hidden sm:inline">{day.toLocaleDateString(intl, { weekday: "short" })}</span>
                    </span>
                    {isToday && <span aria-hidden className="h-1 w-1 rounded-full bg-zinc-50" />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-snug text-zinc-400">
            <Interpolate
              text={t("page.streak_cats_hint")}
              values={{
                rule: (
                  <span className="font-semibold text-zinc-300">
                    {t("page.streak_cats_rule")}
                  </span>
                ),
              }}
            />
          </p>
          <div className="flex gap-3 flex-wrap">
            {CATS.map(cat => (
              <div key={cat.k} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs font-medium text-zinc-400">{catLabel(cat)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLocked ? (
        /* Locked level: no charts — just the goal, the investment explainer and a centered unlock button */
        <div className="flex flex-col items-center gap-6 py-6">
          {/* The "it pays for itself" pitch is for a tier the player could buy
              today. Under a level lock it is an answer to a question they have
              not reached yet, so it waits. */}
          {lockedLvl == null && (() => {
            const weeks = Math.max(1, Math.ceil(nextLevel.cost / nextLevel.reward));
            return (
              <div className="flex w-full max-w-md items-start gap-2.5">
                <TrendingUp size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
                <p className="text-xs leading-snug text-zinc-400">
                  <Interpolate
                    text={t("page.investment")}
                    values={{
                      weeks: (
                        <span className="font-semibold text-zinc-200">
                          {t("page.weeks", { count: weeks })}
                        </span>
                      ),
                      reward: (
                        <span className="font-semibold text-amber-400">
                          {t("page.reward_weekly", { reward: nextLevel.reward })}
                        </span>
                      ),
                    }}
                  />
                </p>
              </div>
            );
          })()}
          {actionButton}
        </div>
      ) : null}
    </div>
  );
}

// ─── RulesAlert ───────────────────────────────────────────────────────────────

const RULES_DISMISSED_KEY = "practiceLevels.rulesDismissed";

// Quiet, manual-style instructions — plain numbered text, not a callout that
// competes with the milestones themselves.
function RulesAlert() {
  const { t } = useTranslation("milestones");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(RULES_DISMISSED_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(RULES_DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const steps: { title: string; desc: React.ReactNode }[] = [0, 1, 2].map(
    (i) => ({
      title: t(`page.rules.${i}.title`),
      desc: t(`page.rules.${i}.desc`),
    }),
  );

  return (
    <div className="relative rounded-lg bg-zinc-800/40 px-6 py-5 pr-14 sm:px-7 sm:py-6">
      <button
        onClick={dismiss}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "absolute top-4 right-4")}
        aria-label={t("page.dismiss")}
      >
        <X />
      </button>

      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <Info className="h-4 w-4 text-zinc-400" />
        {t("page.how_it_works")}
      </p>

      <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-zinc-400">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-2.5">
            <span className="shrink-0 font-semibold tabular-nums text-zinc-500">{i + 1}.</span>
            <span>
              <span className="font-semibold text-zinc-200">{s.title}</span> — {s.desc}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-xs leading-relaxed text-zinc-500">
        {t("page.example")}
      </p>
    </div>
  );
}

// ─── SummaryView ──────────────────────────────────────────────────────────────

export const SummaryView = () => {
  const { t } = useTranslation("milestones");
  const progressTabs = useProgressTabs();
  const intl = useIntlLocale() ?? "en-US";
  const userAuth  = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const dispatch  = useAppDispatch();
  const queryClient = useQueryClient();
  const fame      = userStats?.fame ?? 0;
  const playerLvl = userStats?.lvl ?? 1;

  const [logs, setLogs] = useState<FirebaseUserExceriseLog[]>([]);

  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [peekDate, setPeekDate]         = useState<Date | null>(null);
  const [previewIdx, setPreviewIdx]     = useState<number | null>(null);
  const displayDate = peekDate ?? selectedDate;

  const [levelsState, setLevelsState] = useState<PracticeLevelsState>({
    ownedLevelIds: [1],
    claims: {},
  });
  const [busyLevelId, setBusyLevelId] = useState<number | null>(null);
  const currentWeekKey = useMemo(() => isoWeekKey(today), [today]);

  useEffect(() => {
    if (!userAuth) return;
    // The logs wait for the claims: shown first, they would open the page on a
    // reward already collected this week, with a live Claim button under it.
    const levelsReady = firebaseGetPracticeLevels(userAuth).then(setLevelsState);
    Promise.all([
      firebaseGetUserRaprotsLogs(userAuth, new Date().getFullYear()),
      levelsReady,
    ]).then(([loaded]) => setLogs(loaded));
  }, [userAuth]);

  const ownedSet = useMemo(() => new Set(levelsState.ownedLevelIds), [levelsState.ownedLevelIds]);
  const claimedSet = useMemo(
    () => new Set(
      LEVELS.filter(l => levelsState.claims[l.id]?.weekKey === currentWeekKey).map(l => l.id)
    ),
    [levelsState.claims, currentWeekKey]
  );

  const openingIdx = useMemo(
    () => openingMilestoneIndex(computeProgressData(logs, today), ownedSet, claimedSet),
    [logs, today, ownedSet, claimedSet]
  );
  const activeIdx   = previewIdx ?? openingIdx;
  const activeLevel = LEVELS[activeIdx];

  const isActiveOwned = ownedSet.has(activeLevel.id);
  const isActiveClaimedThisWeek = levelsState.claims[activeLevel.id]?.weekKey === currentWeekKey;

  const handlePurchase = async (levelId: number) => {
    if (!userAuth) return;
    const lvl = LEVELS.find(l => l.id === levelId);
    if (!lvl) return;
    // Checked here as well as in the card, next to the Fame check and for the
    // same reason: this is the one door every purchase goes through.
    const lockedLvl = milestoneLockedAtLvl(lvl, playerLvl, ownedSet.has(levelId));
    if (lockedLvl != null) {
      toast.error(
        t("page.toast_locked", {
          name: levelName(t, lvl),
          lvl: lockedLvl,
          player: playerLvl,
        }),
      );
      return;
    }
    if (fame < lvl.cost) {
      toast.error(t("page.toast_no_fame", { cost: lvl.cost, fame }));
      return;
    }
    setBusyLevelId(levelId);
    const prevOwned = levelsState.ownedLevelIds;
    try {
      dispatch(deductFame(lvl.cost));
      setLevelsState(s => ({ ...s, ownedLevelIds: Array.from(new Set([...s.ownedLevelIds, levelId])) }));
      await firebasePurchaseLevel(userAuth, levelId, lvl.cost, prevOwned);
      // The reward dot and the Home cards read the shared query, not this page's state.
      void queryClient.invalidateQueries({ queryKey: practiceLevelsQueryKey(userAuth) });
      toast.success(t("page.toast_unlocked", { name: levelName(t, lvl) }));
    } catch (err) {
      dispatch(deductFame(-lvl.cost));
      setLevelsState(s => ({ ...s, ownedLevelIds: prevOwned }));
      toast.error(t("page.toast_purchase_failed"));
      console.error(err);
    } finally {
      setBusyLevelId(null);
    }
  };

  const handleClaim = async (levelId: number) => {
    if (!userAuth) return;
    const lvl = LEVELS.find(l => l.id === levelId);
    if (!lvl) return;
    setBusyLevelId(levelId);
    const prevClaims = levelsState.claims;
    try {
      dispatch(addFame(lvl.reward));
      setLevelsState(s => ({
        ...s,
        claims: { ...s.claims, [levelId]: { weekKey: currentWeekKey, claimedAt: new Date().toISOString() } },
      }));
      await firebaseClaimLevel(userAuth, levelId, currentWeekKey, lvl.reward);
      void queryClient.invalidateQueries({ queryKey: practiceLevelsQueryKey(userAuth) });
      toast.success(
        t("page.toast_claimed", { reward: lvl.reward, name: levelName(t, lvl) }),
      );
    } catch (err) {
      dispatch(addFame(-lvl.reward));
      setLevelsState(s => ({ ...s, claims: prevClaims }));
      toast.error(t("page.toast_claim_failed"));
      console.error(err);
    } finally {
      setBusyLevelId(null);
    }
  };

  const subtitleDate = displayDate.toLocaleDateString(intl, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="flex w-full flex-col">
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle", { date: subtitleDate })}
        eyebrow={t("page.eyebrow")}
        backgroundContent={<HeroPattern />}
      />

      <div className={cn(PAGE_GUTTER, "pt-6")}>
        <PageTabs
          tabs={progressTabs}
          activeHref="/summary"
          ariaLabel="Progress sections"
        />
      </div>

      <div className={cn("mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-10", PAGE_CONTENT)}>
        <RulesAlert />

        {/* Progress tracker */}
        <PracticeProgressTracker
          logs={logs}
          today={today}
          activeIdx={activeIdx}
          onPreviewChange={setPreviewIdx}
          ownedSet={ownedSet}
          claimedSet={claimedSet}
          playerLvl={playerLvl}
        />

        {/* Current goal detail */}
        <LevelGoalCard
          logs={logs}
          today={today}
          displayDate={displayDate}
          onSelectDay={setSelectedDate}
          onPeekDay={setPeekDate}
          activeIdx={activeIdx}
          isOwned={isActiveOwned}
          isClaimedThisWeek={isActiveClaimedThisWeek}
          fame={fame}
          busy={busyLevelId !== null}
          onPurchase={handlePurchase}
          onClaim={handleClaim}
          playerLvl={playerLvl}
        />

      </div>
    </div>
  );
};
