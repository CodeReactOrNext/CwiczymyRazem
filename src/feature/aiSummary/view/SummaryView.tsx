import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import {
  firebaseClaimLevel,
  firebaseGetPracticeLevels,
  firebasePurchaseLevel,
  type PracticeLevelsState,
} from "feature/aiSummary/services/practiceLevels.service";
import {
  computeProgressData, currentWeekDates, isoWeekKey, isSameDay,
  LEVEL_COLORS, LEVELS, localDateStr, MS_15,
} from "feature/aiSummary/utils/milestoneLogic";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import {
  addFame,
  deductFame,
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight, Info,
  Lock, Sparkles, TrendingUp, Trophy, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";
import { useAppSelector } from "store/hooks";

// ─── helpers ──────────────────────────────────────────────────────────────────

// Compact hours format ("98m" → "1h38m") matching the activity widget.
function fmtMin(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h${rem}m` : `${h}h`;
}

// ─── Category theme (single source of truth) ───────────────────────────────────
// One place that defines every practice category's key, label, colour and the
// matching field on the log. Used by the goal-card day grids and every legend so
// colours never drift apart again.

type CatKey = "tech" | "theory" | "hearing" | "creat";

const CATEGORIES: {
  k: CatKey;
  label: string;
  color: string;
  logField: "techniqueTime" | "theoryTime" | "hearingTime" | "creativityTime";
}[] = [
  { k: "tech",    label: "Tech",       color: "#ef4444", logField: "techniqueTime"  },
  { k: "theory",  label: "Theory",     color: "#0891B2", logField: "theoryTime"     },
  { k: "hearing", label: "Ear",        color: "#10b981", logField: "hearingTime"    },
  { k: "creat",   label: "Creativity", color: "#f59e0b", logField: "creativityTime" },
];

// ─── Progress Level System ────────────────────────────────────────────────────
// Level defs + progress maths live in feature/aiSummary/utils/milestoneLogic so
// the sidebar "unclaimed reward" indicator shares the exact same rules.

// ─── PracticeProgressTracker ──────────────────────────────────────────────────
// The milestone map: one node per level joined by a trail that fills green as
// levels are reached. Tapping a node loads its goal into the card below.

function PracticeProgressTracker({
  logs, today, previewIdx, onPreviewChange, ownedSet, claimedSet,
}: {
  logs: FirebaseUserExceriseLog[];
  today: Date;
  previewIdx: number | null;
  onPreviewChange: (idx: number) => void;
  ownedSet: Set<number>;
  claimedSet: Set<number>;
}) {
  const data = useMemo(() => computeProgressData(logs, today), [logs, today]);

  const levelStatuses = LEVELS.map(l => ({
    ...l,
    met:      l.isMet(data),
    progress: l.getProgress(data),
  }));

  const realNextIdx = levelStatuses.findIndex(s => !s.met);
  const activeIdx   = previewIdx ?? (realNextIdx === -1 ? LEVELS.length - 1 : realNextIdx);
  const metCount    = levelStatuses.filter(s => s.met).length;
  const activeColor = LEVEL_COLORS[levelStatuses[activeIdx].id - 1];

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

  const GREEN = "#22c55e";     // "reached" colour, shared by discs, trail and labels
  const NODE = 56;             // node diameter
  const CENTER = NODE / 2;     // vertical centre → trail height

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-zinc-800/40 backdrop-blur-sm shadow-sm px-4 py-6 sm:px-6 sm:py-7">
      {/* arrows flank the strip like a carousel, aligned to the node centres */}
      <div className="flex items-start gap-1 sm:gap-2">
        <button
          onClick={() => onPreviewChange(Math.max(0, activeIdx - 1))}
          disabled={activeIdx === 0}
          aria-label="Previous level"
          className="mt-3.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        {/* milestone nodes */}
        <div
          ref={scrollRef}
          className="flex flex-1 items-start overflow-x-auto no-scrollbar snap-x snap-mandatory pt-1 sm:snap-none sm:overflow-x-visible"
        >
        {levelStatuses.map((level, idx) => {
          const isOwned     = ownedSet.has(level.id);
          const isClaimed   = claimedSet.has(level.id);
          const isClaimable = level.met && isOwned && !isClaimed;   // reward waiting to collect
          const isCurrent   = idx === activeIdx;
          const showLock    = !isOwned && level.cost > 0;
          const baseColor   = LEVEL_COLORS[level.id - 1];
          const ringColor   = level.met ? GREEN : baseColor;   // reached rings turn green
          const prevMet     = idx > 0 && levelStatuses[idx - 1].met;

          const R      = 23;   // ring radius inside the 56px node
          const CIRC   = 2 * Math.PI * R;
          const pct    = level.progress.max > 0 ? level.progress.value / level.progress.max : 0;
          const offset = CIRC - (level.met ? 1 : pct) * CIRC;
          const stroke = isCurrent ? 4 : 3;

          return (
            <button
              key={level.id}
              ref={isCurrent ? activeRef : undefined}
              type="button"
              onClick={() => onPreviewChange(idx)}
              aria-label={`${level.name} — ${level.met ? "reached" : showLock ? "locked" : "in progress"}`}
              className="group relative flex w-[80px] shrink-0 snap-center flex-col items-center gap-3 outline-none sm:w-auto sm:flex-1 sm:min-w-0"
            >
              {/* trail segment linking this node to the previous one */}
              {idx > 0 && (
                <span
                  aria-hidden
                  className="absolute left-[-50%] right-1/2 h-[3px] rounded-full transition-colors"
                  style={{ top: CENTER - 1.5, backgroundColor: prevMet ? GREEN : "#3f3f46" }}
                />
              )}

              {/* node — solid disc, never transparent */}
              <div
                className="relative z-10 flex items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
                style={{ width: NODE, height: NODE }}
              >
                {isCurrent && (
                  <span
                    aria-hidden
                    className="absolute inset-[-4px] rounded-full"
                    style={{ boxShadow: `0 0 0 2px ${ringColor}, 0 0 16px ${ringColor}55` }}
                  />
                )}
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: level.met ? GREEN : showLock ? "#1e1e22" : "#2e2e34",
                    boxShadow: level.met ? `0 2px 10px ${GREEN}40` : undefined,
                  }}
                />
                {!level.met && (
                  <svg viewBox={`0 0 ${NODE} ${NODE}`} className="absolute inset-0 h-full w-full -rotate-90">
                    <circle
                      cx={CENTER} cy={CENTER} r={R}
                      fill="none"
                      stroke={showLock ? "#45454d" : "#52525b"}
                      strokeWidth={stroke}
                      strokeDasharray={showLock ? "3 4" : undefined}
                    />
                    {!showLock && pct > 0 && (
                      <circle
                        cx={CENTER} cy={CENTER} r={R}
                        fill="none"
                        stroke={baseColor}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={offset}
                        className="transition-[stroke-dashoffset] duration-700 ease-out"
                      />
                    )}
                  </svg>
                )}
                <span className="relative">
                  {showLock ? (
                    <Lock className="h-5 w-5 text-zinc-500" />
                  ) : level.met ? (
                    <Check className="h-6 w-6 text-emerald-950" strokeWidth={3} />
                  ) : (
                    <level.Icon className="h-5 w-5" style={{ color: isCurrent ? baseColor : "#8e8e98" }} />
                  )}
                </span>

                {/* reward status: amber pulse = uncollected reward, emerald = claimed */}
                {isClaimable && (
                  <span
                    aria-label="Reward ready to claim"
                    className="absolute -right-0.5 -top-0.5 z-20 h-3.5 w-3.5 rounded-full bg-amber-500 animate-pulse ring-2 ring-zinc-900"
                  />
                )}
                {isClaimed && (
                  <span
                    aria-label="Reward claimed"
                    className="absolute -right-0.5 -top-0.5 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-zinc-900"
                  >
                    <Check size={9} strokeWidth={3.5} className="text-zinc-950" />
                  </span>
                )}
              </div>

              {/* label */}
              <span
                className="w-full max-w-[72px] truncate px-0.5 text-center text-[11px] font-semibold leading-none"
                style={{ color: isCurrent ? "#fafafa" : level.met ? "#d4d4d8" : "#8e8e98" }}
                title={level.name}
              >
                {level.short ?? level.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
        </div>

        <button
          onClick={() => onPreviewChange(Math.min(LEVELS.length - 1, activeIdx + 1))}
          disabled={activeIdx === LEVELS.length - 1}
          aria-label="Next level"
          className="mt-3.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-800 pt-4">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GREEN }} />
          Reached
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <span className="h-2.5 w-2.5 rounded-full border-2 bg-transparent" style={{ borderColor: activeColor }} />
          Current goal
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <Lock size={11} className="text-zinc-500" />
          Locked
        </span>
        <span className="ml-auto text-[11px] font-semibold tabular-nums text-zinc-500">
          {metCount}/{LEVELS.length} reached
        </span>
      </div>
    </div>
  );
}

// ─── LevelGoalCard ────────────────────────────────────────────────────────────

// Shares the single CATEGORIES theme defined at the top of the file.
const CATS = CATEGORIES;

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
  logs, today, displayDate, onSelectDay, onPeekDay, previewIdx,
  isOwned, isClaimedThisWeek, fame, busy, onPurchase, onClaim,
}: {
  logs: FirebaseUserExceriseLog[];
  today: Date;
  displayDate: Date;
  onSelectDay: (d: Date) => void;
  onPeekDay: (d: Date | null) => void;
  previewIdx: number | null;
  isOwned: boolean;
  isClaimedThisWeek: boolean;
  fame: number;
  busy: boolean;
  onPurchase: (levelId: number) => void;
  onClaim: (levelId: number) => void;
}) {
  const progressData  = useMemo(() => computeProgressData(logs, today), [logs, today]);
  const levelStatuses = useMemo(
    () => LEVELS.map(l => ({ ...l, met: l.isMet(progressData), progress: l.getProgress(progressData) })),
    [progressData]
  );
  const realNextIdx = levelStatuses.findIndex(s => !s.met);
  const activeIdx   = previewIdx ?? (realNextIdx === -1 ? LEVELS.length - 1 : realNextIdx);
  const nextLevel   = levelStatuses[activeIdx];
  const byDate      = useMemo(() => buildByDate(logs), [logs]);

  if (!nextLevel) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-zinc-800/40 backdrop-blur-sm shadow-sm px-5 py-4">
        <Trophy size={20} className="text-amber-400" />
        <p className="text-sm font-semibold text-zinc-200">All levels unlocked — you&apos;re a Virtuoso!</p>
      </div>
    );
  }

  const color          = LEVEL_COLORS[nextLevel.id - 1];
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
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      minutes, ok, isToday, isFuture,
      isSelected: isSameDay(day, displayDate),
    };
  });

  const isMet         = nextLevel.met;
  const isLocked      = !isOwned && nextLevel.cost > 0;
  const canAfford     = fame >= nextLevel.cost;
  const canClaim      = isOwned && isMet && !isClaimedThisWeek;

  const REWARD_GREEN = "#22c55e";
  const btnBase = "flex w-full items-center justify-center gap-2.5 rounded-[8px] px-6 py-3.5 text-base font-bold transition-all sm:w-auto";

  let actionButton: React.ReactNode = null;
  if (isLocked) {
    actionButton = (
      <button
        onClick={() => onPurchase(nextLevel.id)}
        disabled={busy || !canAfford}
        className={`${btnBase} active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
        style={{
          backgroundColor: canAfford ? `${color}22` : "#27272a",
          color: canAfford ? color : "#71717a",
          border: `2px solid ${canAfford ? color + "70" : "#3f3f46"}`,
          boxShadow: canAfford ? `0 0 12px ${color}40` : undefined,
        }}
      >
        <Lock size={18} />
        <span>Unlock once for</span>
        <img src="/images/coin.png" alt="Fame" className="h-5 w-5 object-contain" />
        <span className="tabular-nums">{nextLevel.cost}</span>
        {!canAfford && <span className="text-xs font-medium text-zinc-500">(need {nextLevel.cost - fame} more)</span>}
      </button>
    );
  } else if (canClaim) {
    // goal reached → reward unlocked, claimable
    actionButton = (
      <button
        onClick={() => onClaim(nextLevel.id)}
        disabled={busy}
        className={`${btnBase} animate-pulse hover:animate-none active:scale-95 disabled:opacity-50`}
        style={{
          backgroundColor: REWARD_GREEN,
          color: "#052e16",
          boxShadow: `0 0 18px ${REWARD_GREEN}99`,
        }}
      >
        <Sparkles size={18} />
        <span>Claim reward</span>
        <img src="/images/coin.png" alt="Fame" className="h-5 w-5 object-contain" />
        <span className="tabular-nums">+{nextLevel.reward}</span>
      </button>
    );
  } else if (isOwned && isClaimedThisWeek) {
    // nothing left to do this week — a quiet status line, not a fake button
    actionButton = (
      <p className="flex items-center gap-2 text-[13px] text-zinc-500">
        <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
        <span>
          <span className="font-semibold text-zinc-300">+{nextLevel.reward} Fame</span> claimed — this level pays again next week.
        </span>
      </p>
    );
  } else if (isOwned && !isMet) {
    // reward preview stays plain text; it only becomes a button once claimable
    actionButton = (
      <p className="flex items-center gap-2 text-[13px] text-zinc-500">
        <img src="/images/coin.png" alt="Fame" className="h-4 w-4 shrink-0 object-contain" />
        <span>
          Reward: <span className="font-semibold text-amber-400">+{nextLevel.reward} Fame</span> — claim it once the goal is done.
        </span>
      </p>
    );
  }

  // Goal statement — plain typography, deliberately not a box so it can't be
  // mistaken for a button. The claim button is the only button-shaped thing here.
  const goalAccent = isMet ? "#22c55e" : color;
  const goalBox = (
    <div className="flex w-full items-start gap-3 text-left">
      <div
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all"
        style={{
          backgroundColor: isMet ? goalAccent : "transparent",
          border: isMet ? undefined : "2px solid #52525b",
        }}
      >
        {isMet && <Check size={15} strokeWidth={3.5} className="text-zinc-950" />}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-xs font-medium" style={{ color: isMet ? goalAccent : "#a1a1aa" }}>
          {isMet ? "Goal complete" : "Your goal this week"}
        </p>
        <p className="mt-0.5 text-lg font-bold leading-snug text-zinc-50">{nextLevel.req}</p>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg bg-zinc-800/40 backdrop-blur-sm shadow-sm p-5 sm:p-7 space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <nextLevel.Icon size={20} />
          {!isOwned && nextLevel.cost > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center">
              <Lock size={9} className="text-zinc-500" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-zinc-100 leading-tight">{nextLevel.name}</p>
            {isOwned && isClaimedThisWeek && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">Claimed</span>
            )}
            {isOwned && !isClaimedThisWeek && isMet && (
              <span className="animate-pulse rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">Claim</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          {isLocked ? (
            <>
              <p className="flex items-center justify-end gap-1 text-xs font-semibold text-zinc-500 line-through">
                <img src="/images/coin.png" alt="" className="h-3 w-3 object-contain opacity-50" />
                <span className="tabular-nums">{nextLevel.cost} once</span>
              </p>
              <p className="mt-0.5 flex items-center justify-end gap-1 font-black leading-none text-amber-400">
                <img src="/images/coin.png" alt="Fame" className="h-5 w-5 object-contain" />
                <span className="text-2xl tabular-nums">+{nextLevel.reward}</span>
                <span className="text-sm text-zinc-500">/wk</span>
              </p>
            </>
          ) : (
            <>
              <p className="tabular-nums leading-none font-black" style={{ color }}>
                <span className="text-3xl">{value}</span>
                <span className="text-lg text-zinc-600">/{max}</span>
              </p>
              <p className="text-[10px] text-zinc-600 mt-1">{Math.round((value / max) * 100)}% done</p>
            </>
          )}
        </div>
      </div>

      {/* Goal + reward surfaced right under the header so the claim is impossible
          to miss — the chart below is supporting detail, not the call-to-action. */}
      {!isLocked && (
        <div className="space-y-4">
          {goalBox}
          {actionButton && (
            <div className="[&>button]:w-full [&>p]:pl-10">
              {actionButton}
            </div>
          )}
        </div>
      )}

      {/* ── week-bars (levels 1,2,4) ── */}
      {!isLocked && levelType === "week-bars" && (() => {
        const maxMin     = Math.max(dayGoalMin * 2, ...dayBars.map(d => d.minutes));
        const CHART_H    = 160;          // bar track height
        const LABEL_AREA = 52;           // status mark + weekday below
        const VALUE_H    = 22;           // minutes value above bar
        const GOAL_PX    = (dayGoalMin / maxMin) * CHART_H;
        const GREEN      = "#4ade80";
        const CYAN       = "rgb(6,182,212)";
        return (
          <div className="border-t border-zinc-800/70 pt-6">
            <div className="relative">
            {/* 15-min goal line */}
            <div
              className="pointer-events-none absolute left-0 right-0 z-10 flex items-end"
              style={{ bottom: `${LABEL_AREA + GOAL_PX}px` }}
            >
              <div className="flex-1 border-t border-dashed border-white/25" />
              <span className="-mb-2 ml-2 rounded bg-zinc-900/70 px-1.5 py-0.5 text-[11px] font-semibold text-white/45">
                {dayGoalMin} min goal
              </span>
            </div>
            <div className="flex items-end gap-1.5 sm:gap-2.5">
              {dayBars.map((entry, i) => {
                const day      = weekDays[i];
                const isMissed = !entry.ok && !entry.isFuture && !entry.isToday;
                const heightPx = entry.minutes > 0
                  ? Math.max((entry.minutes / maxMin) * CHART_H, 6)
                  : isMissed ? 3 : 0;
                const barColor = entry.ok
                  ? GREEN
                  : entry.minutes > 0
                  ? CYAN
                  : isMissed
                  ? "rgba(239,68,68,0.45)"
                  : "rgba(255,255,255,0.06)";
                const valueColor = entry.ok ? GREEN : entry.minutes > 0 ? CYAN : "transparent";
                const labelColor = entry.isSelected
                  ? "#fafafa"
                  : entry.ok
                  ? GREEN
                  : entry.isToday
                  ? "#e4e4e7"
                  : entry.isFuture
                  ? "#3f3f46"
                  : "#a1a1aa";
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => onPeekDay(day)}
                    onMouseLeave={() => onPeekDay(null)}
                    onClick={() => onSelectDay(day)}
                    className="group flex flex-1 flex-col items-center justify-end cursor-pointer select-none touch-manipulation outline-none"
                  >
                    {/* minutes value above the bar */}
                    <span
                      className="text-xs sm:text-sm font-bold tabular-nums leading-none"
                      style={{ height: VALUE_H, color: valueColor }}
                    >
                      {entry.minutes > 0 ? fmtMin(entry.minutes) : ""}
                    </span>
                    {/* bar + track */}
                    <div
                      className="flex w-full max-w-[56px] items-end justify-center rounded-md"
                      style={{
                        height: CHART_H,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        outline: entry.isSelected ? `2px solid ${entry.ok ? GREEN : CYAN}` : undefined,
                        outlineOffset: "2px",
                      }}
                    >
                      <div
                        className="w-full rounded-md transition-all group-hover:brightness-125"
                        style={{
                          height: heightPx,
                          backgroundColor: barColor,
                          boxShadow: entry.ok ? `0 0 8px ${GREEN}55` : undefined,
                        }}
                      />
                    </div>
                    {/* status mark + weekday */}
                    <div className="flex flex-col items-center gap-0.5 pt-2" style={{ height: LABEL_AREA }}>
                      <span className="flex h-5 items-center">
                        {entry.ok ? (
                          <CheckCircle2 size={18} style={{ color: GREEN }} />
                        ) : isMissed ? (
                          <X size={16} className="text-red-500/60" />
                        ) : null}
                      </span>
                      <span className="text-xs sm:text-sm font-bold transition-colors" style={{ color: labelColor }}>
                        <span className="sm:hidden">{day.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                        <span className="hidden sm:inline">{entry.label}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-[11px] leading-snug text-zinc-500">
              <CheckCircle2 size={12} style={{ color: GREEN }} className="shrink-0" />
              <span>Each day with <span className="font-semibold text-zinc-300">{dayGoalMin}+ min</span> of practice counts — green bars are days you completed.</span>
            </p>
          </div>
        );
      })()}

      {/* ── streak-simple (levels 3,5) ── */}
      {!isLocked && levelType === "streak-simple" && (
        <div className="space-y-5 border-t border-zinc-800/70 pt-6">
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
                  className="group flex flex-1 flex-col items-center gap-2 cursor-pointer select-none touch-manipulation outline-none"
                >
                  <div
                    className="flex w-full h-28 flex-col items-center justify-center gap-1 rounded-lg transition-all group-hover:brightness-125"
                    style={{
                      backgroundColor: inStreak ? `${color}30` : "#18181b",
                      border: `2px solid ${isShown ? color : inStreak ? color + "80" : isToday ? "#52525b" : "#27272a"}`,
                      boxShadow: inStreak || isShown ? `0 0 8px ${color}55` : undefined,
                    }}
                  >
                    {met ? (
                      <>
                        <CheckCircle2 size={28} style={{ color: inStreak ? color : "#71717a" }} />
                        <span className="text-sm font-bold tabular-nums" style={{ color: inStreak ? color : "#a1a1aa" }}>
                          {fmtMin(minutes)}
                        </span>
                      </>
                    ) : minutes > 0 ? (
                      <span className="text-base font-bold tabular-nums text-zinc-300">{fmtMin(minutes)}</span>
                    ) : isFuture ? (
                      <span className="text-zinc-700 text-xl leading-none">·</span>
                    ) : (
                      <X size={24} className="text-zinc-600" />
                    )}
                  </div>
                  <span className="text-sm font-bold transition-colors" style={{ color: isShown ? color : "#a1a1aa" }}>
                    {day.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="flex items-center gap-1.5 text-[10px] leading-snug text-zinc-500">
            <CheckCircle2 size={11} style={{ color }} className="shrink-0" />
            <span>Practice <span className="font-semibold text-zinc-300">15+ min every day in a row</span> — a skipped day resets the streak.</span>
          </p>
        </div>
      )}

      {/* ── week-cats (level 6) ── */}
      {!isLocked && levelType === "week-cats" && (
        <div className="space-y-5 border-t border-zinc-800/70 pt-6">
          <div className="flex gap-1.5 sm:gap-2">
            {weekDays.map((day, i) => {
              const key      = localDateStr(day);
              const stats    = byDate.get(key);
              const met      = CATS.map(c => (stats?.[c.k] ?? 0) >= MS_15);
              const metCount = met.filter(Boolean).length;
              const allMet   = metCount === CATS.length;
              const isShown  = isSameDay(day, displayDate);
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => onPeekDay(day)}
                  onMouseLeave={() => onPeekDay(null)}
                  onClick={() => onSelectDay(day)}
                  className="group flex-1 min-w-0 flex flex-col items-center justify-center gap-2 sm:gap-2.5 rounded-lg py-3 px-0.5 sm:py-4 sm:px-1 cursor-pointer select-none touch-manipulation outline-none transition-all hover:brightness-125"
                  style={{
                    minHeight: 112,
                    backgroundColor: allMet ? `${color}18` : "#18181b",
                    border: `2px solid ${isShown ? color : allMet ? color + "40" : "#27272a"}`,
                    boxShadow: allMet || isShown ? `0 0 8px ${color}30` : undefined,
                  }}
                >
                  {/* one dot per category — lit when that category hit 15+ min */}
                  <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                    {CATS.map((cat, ci) => (
                      <div
                        key={cat.k}
                        title={`${cat.label}${met[ci] ? " ✓" : ""}`}
                        className="h-3 w-3 sm:h-4 sm:w-4 rounded-full transition-all"
                        style={{
                          backgroundColor: met[ci] ? cat.color : "#27272a",
                          boxShadow: met[ci] ? `0 0 8px ${cat.color}` : undefined,
                          border: met[ci] ? `1px solid ${cat.color}` : "1.5px solid #52525b",
                        }}
                      />
                    ))}
                  </div>
                  {/* clear status: full check or n/4 */}
                  {allMet ? (
                    <CheckCircle2 size={20} style={{ color }} />
                  ) : (
                    <span className="text-sm font-bold tabular-nums text-zinc-400">{metCount}/4</span>
                  )}
                  <span className="text-sm font-bold" style={{ color: isShown || allMet ? color : "#a1a1aa" }}>
                    {day.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="flex items-center gap-1.5 text-[10px] leading-snug text-zinc-500">
            <CheckCircle2 size={11} style={{ color }} className="shrink-0" />
            <span>A day counts only when <span className="font-semibold text-zinc-300">all 4 categories reach 15+ min</span>.</span>
          </p>
          <div className="flex gap-3 flex-wrap">
            {CATS.map(cat => (
              <div key={cat.k} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs font-medium text-zinc-400">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── streak-cats (levels 7,8,9) ── */}
      {!isLocked && levelType === "streak-cats" && (
        <div className="space-y-5 border-t border-zinc-800/70 pt-6">
          <div className="flex gap-1.5 sm:gap-2">
            {weekDays.map((day, i) => {
              const key      = localDateStr(day);
              const stats    = byDate.get(key);
              const inStreak = streakKeys.has(key);
              const isToday  = isSameDay(day, today);
              const isShown  = isSameDay(day, displayDate);
              const metCount = CATS.filter(c => (stats?.[c.k] ?? 0) >= MS_15).length;
              const allMet   = metCount === CATS.length;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => onPeekDay(day)}
                  onMouseLeave={() => onPeekDay(null)}
                  onClick={() => onSelectDay(day)}
                  className="group flex flex-1 min-w-0 flex-col items-center gap-2 cursor-pointer select-none touch-manipulation outline-none"
                >
                  <div
                    className="flex w-full flex-col rounded-xl p-1.5 sm:p-2.5 transition-all group-hover:brightness-125"
                    style={{
                      minHeight: 128,
                      backgroundColor: allMet ? `${color}26` : inStreak ? `${color}18` : "#18181b",
                      border: `2px solid ${isShown ? color : inStreak ? color + "70" : isToday ? "#52525b" : "#27272a"}`,
                      boxShadow: inStreak || isShown ? `0 0 10px ${color}50` : undefined,
                    }}
                  >
                    {/* status: full check or how many of 4 categories done */}
                    <div className="flex h-6 items-center justify-center mb-2">
                      {allMet ? (
                        <CheckCircle2 size={22} style={{ color }} />
                      ) : (
                        <span className="text-sm font-bold tabular-nums text-zinc-400">{metCount}/4</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-2">
                      {CATS.map(cat => {
                        const time = stats?.[cat.k] ?? 0;
                        const pct  = Math.min(time / MS_15, 1) * 100;
                        const met  = time >= MS_15;
                        return (
                          <div key={cat.k} className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: cat.color,
                                boxShadow: met ? `0 0 6px ${cat.color}` : undefined,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <span
                    className="text-xs sm:text-sm font-bold transition-colors"
                    style={{ color: isShown ? color : allMet ? color : isToday ? "#e4e4e7" : "#a1a1aa" }}
                  >
                    <span className="sm:hidden">{day.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                    <span className="hidden sm:inline">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="flex items-center gap-1.5 text-[10px] leading-snug text-zinc-500">
            <CheckCircle2 size={11} style={{ color }} className="shrink-0" />
            <span>Each bar is one category — fill <span className="font-semibold text-zinc-300">all 4 to 15+ min, every day in a row</span>.</span>
          </p>
          <div className="flex gap-3 flex-wrap">
            {CATS.map(cat => (
              <div key={cat.k} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-xs font-medium text-zinc-400">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLocked ? (
        /* Locked level: no charts — just the goal, the investment explainer and a centered unlock button */
        <div className="flex flex-col items-center gap-6 py-6">
          {goalBox}
          {(() => {
            const weeks = Math.max(1, Math.ceil(nextLevel.cost / nextLevel.reward));
            return (
              <div className="flex w-full max-w-md items-start gap-2.5">
                <TrendingUp size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
                <p className="text-[12px] leading-snug text-zinc-400">
                  One-time investment. It pays for itself in{" "}
                  <span className="font-semibold text-zinc-200">{weeks} week{weeks > 1 ? "s" : ""}</span>, then you keep claiming{" "}
                  <span className="font-semibold text-amber-400">+{nextLevel.reward} Fame every week</span> you hit the goal — for good.
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
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(RULES_DISMISSED_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(RULES_DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const steps: { title: string; desc: React.ReactNode }[] = [
    { title: "Unlock a level once", desc: <>pay Fame once and it&apos;s yours for good. The first one is free.</> },
    { title: "Practice",            desc: <>hit that level&apos;s weekly goal.</> },
    { title: "Claim",               desc: <>collect the Fame reward — again every week you hit the goal.</> },
  ];

  return (
    <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-5 pr-14 sm:px-7 sm:py-6">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <Info size={15} className="text-zinc-400" />
        How it works
      </p>

      <ol className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-zinc-400">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-2.5">
            <span className="shrink-0 font-semibold tabular-nums text-zinc-500">{i + 1}.</span>
            <span>
              <span className="font-semibold text-zinc-200">{s.title}</span> — {s.desc}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-5 border-t border-zinc-800/80 pt-4 text-xs leading-relaxed text-zinc-500">
        Example: Groove costs 40 Fame once and pays +30 a week, so it pays for itself in week two.
        Goals and claims reset every week — one claim per level a week, higher levels pay more.
      </p>
    </div>
  );
}

// ─── SummaryView ──────────────────────────────────────────────────────────────

export const SummaryView = () => {
  const userAuth  = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const dispatch  = useAppDispatch();
  const fame      = userStats?.fame ?? 0;

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
    firebaseGetUserRaprotsLogs(userAuth, new Date().getFullYear()).then(setLogs);
    firebaseGetPracticeLevels(userAuth).then(setLevelsState);
  }, [userAuth]);

  const ownedSet = useMemo(() => new Set(levelsState.ownedLevelIds), [levelsState.ownedLevelIds]);
  const claimedSet = useMemo(
    () => new Set(
      LEVELS.filter(l => levelsState.claims[l.id]?.weekKey === currentWeekKey).map(l => l.id)
    ),
    [levelsState.claims, currentWeekKey]
  );

  const activeLevel = useMemo(() => {
    const data = computeProgressData(logs, today);
    const realNextIdx = LEVELS.findIndex(l => !l.isMet(data));
    const idx = previewIdx ?? (realNextIdx === -1 ? LEVELS.length - 1 : realNextIdx);
    return LEVELS[idx];
  }, [logs, today, previewIdx]);

  const isActiveOwned = ownedSet.has(activeLevel.id);
  const isActiveClaimedThisWeek = levelsState.claims[activeLevel.id]?.weekKey === currentWeekKey;

  const handlePurchase = async (levelId: number) => {
    if (!userAuth) return;
    const lvl = LEVELS.find(l => l.id === levelId);
    if (!lvl) return;
    if (fame < lvl.cost) {
      toast.error(`Not enough Fame (need ${lvl.cost}, have ${fame})`);
      return;
    }
    setBusyLevelId(levelId);
    const prevOwned = levelsState.ownedLevelIds;
    try {
      dispatch(deductFame(lvl.cost));
      setLevelsState(s => ({ ...s, ownedLevelIds: Array.from(new Set([...s.ownedLevelIds, levelId])) }));
      await firebasePurchaseLevel(userAuth, levelId, lvl.cost, prevOwned);
      toast.success(`${lvl.name} unlocked!`);
    } catch (err) {
      dispatch(deductFame(-lvl.cost));
      setLevelsState(s => ({ ...s, ownedLevelIds: prevOwned }));
      toast.error("Purchase failed");
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
      toast.success(`+${lvl.reward} Fame from ${lvl.name}`);
    } catch (err) {
      dispatch(addFame(-lvl.reward));
      setLevelsState(s => ({ ...s, claims: prevClaims }));
      toast.error("Claim failed");
      console.error(err);
    } finally {
      setBusyLevelId(null);
    }
  };

  const subtitleDate = displayDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="flex w-full flex-col">
      <HeroBanner
        title="Milestones"
        subtitle={`Weekly rewards for hitting practice goals — ${subtitleDate}`}
        eyebrow="Practice"
        backgroundContent={<HeroPattern />}
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-14 md:gap-10 md:p-8 md:pb-20 lg:p-10 lg:pb-24">

        <RulesAlert />

        {/* Progress tracker */}
        <PracticeProgressTracker
          logs={logs}
          today={today}
          previewIdx={previewIdx}
          onPreviewChange={setPreviewIdx}
          ownedSet={ownedSet}
          claimedSet={claimedSet}
        />

        {/* Current goal detail */}
        <LevelGoalCard
          logs={logs}
          today={today}
          displayDate={displayDate}
          onSelectDay={setSelectedDate}
          onPeekDay={setPeekDate}
          previewIdx={previewIdx}
          isOwned={isActiveOwned}
          isClaimedThisWeek={isActiveClaimedThisWeek}
          fame={fame}
          busy={busyLevelId !== null}
          onPurchase={handlePurchase}
          onClaim={handleClaim}
        />

      </div>
    </div>
  );
};
