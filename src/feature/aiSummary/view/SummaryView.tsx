import { cn } from "assets/lib/utils";
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
  Check, CheckCircle2, ChevronLeft, ChevronRight, Guitar, Info,
  ListMusic, Lock, Sparkles, Target, TrendingUp, Trophy, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";
import { useAppSelector } from "store/hooks";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtMs(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

// Compact hours format ("98m" → "1h38m") matching the activity widget.
function fmtMin(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h${rem}m` : `${h}h`;
}

// ─── Category theme (single source of truth) ───────────────────────────────────
// One place that defines every practice category's key, label, colour and the
// matching field on the log. Used by the session chips, the day grids and every
// legend so colours never drift apart again.

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

// ─── DayTimeline ─────────────────────────────────────────────────────────────

const SESSION_PALETTE = ["#10b981", "#0891B2", "#e5626b", "#f59e0b", "#f97316", "#ec4899"];

function DayTimeline({ logs }: { logs: FirebaseUserExceriseLog[] }) {
  if (!logs.length) return null;

  const sessions = logs.map((log, i) => {
    const endMs   = log.reportDate.seconds * 1000;
    const durMs   = log.timeSumary?.sumTime || 0;
    const pinMin  = new Date(endMs).getHours() * 60 + new Date(endMs).getMinutes();
    const color   = SESSION_PALETTE[i % SESSION_PALETTE.length];
    const chips = CATEGORIES
      .map(cat => ({ label: cat.label, color: cat.color, val: log.timeSumary?.[cat.logField] || 0 }))
      .filter(c => c.val > 0);
    return { log, endMs, pinMin, durMs, color, chips };
  });

  const fmt = (ms: number) =>
    new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  const allMins    = sessions.map(s => s.pinMin);
  const rangeStart = Math.max(0,    Math.floor((Math.min(...allMins) - 60) / 60) * 60);
  const rangeEnd   = Math.min(1440, Math.ceil ((Math.max(...allMins) + 60) / 60) * 60);
  const rangeDur   = Math.max(rangeEnd - rangeStart, 1);

  const VW     = 1000;
  const AXIS_Y = 90;
  const TALL   = 65;
  const SHORT  = 38;
  const R      = 12;
  const LABEL_Y = AXIS_Y + 20;
  const VH     = LABEL_Y + 8;
  const toX    = (min: number) => ((min - rangeStart) / rangeDur) * VW;

  const hourMarks = Array.from(
    { length: Math.floor(rangeDur / 60) + 1 },
    (_, i) => rangeStart + i * 60
  );

  return (
    <div className="rounded-lg bg-zinc-800/40 backdrop-blur-sm shadow-sm overflow-hidden">
      <div className="px-5 pt-6 pb-3">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full overflow-visible" style={{ height: VH }}>
          <defs>
            {sessions.map((s, i) => (
              <linearGradient key={i} id={`pin-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={s.color} stopOpacity="1" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.5" />
              </linearGradient>
            ))}
          </defs>

          <line x1={0} y1={AXIS_Y} x2={VW} y2={AXIS_Y} stroke="#3f3f46" strokeWidth="1.5" />

          {hourMarks.map(m => (
            <g key={m}>
              <line x1={toX(m)} y1={AXIS_Y - 4} x2={toX(m)} y2={AXIS_Y + 4} stroke="#52525b" strokeWidth="1.5" />
              <text x={toX(m)} y={LABEL_Y} textAnchor="middle" fontSize="10" fill="#52525b">
                {`${String(Math.floor(m / 60)).padStart(2, "0")}:00`}
              </text>
            </g>
          ))}

          {sessions.map((s, i) => {
            const x      = toX(s.pinMin);
            const pinH   = i % 2 === 0 ? TALL : SHORT;
            const pinTop = AXIS_Y - pinH;
            const cx     = x;
            const cy     = pinTop;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={R + 4} fill={s.color} opacity="0.15" />
                <line x1={cx} y1={cy + R} x2={cx} y2={AXIS_Y} stroke={s.color} strokeWidth="2" strokeDasharray="3,2" opacity="0.6" />
                <circle cx={cx} cy={AXIS_Y} r="3.5" fill={s.color} />
                <circle cx={cx} cy={cy} r={R} fill={`url(#pin-grad-${i})`} />
                <circle cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.5" />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800/40">
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-zinc-900/40">
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: `${s.color}22`, color: s.color, boxShadow: `0 0 0 1.5px ${s.color}40` }}
            >
              {i + 1}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate leading-snug">
                {s.log.exceriseTitle || "Practice session"}
              </p>
              {s.log.songTitle && (
                <p className="text-xs text-zinc-600 truncate">
                  {s.log.songArtist ? `${s.log.songArtist} — ` : ""}{s.log.songTitle}
                </p>
              )}
              <p className="text-xs tabular-nums mt-0.5" style={{ color: `${s.color}aa` }}>
                {fmt(s.endMs)}{s.durMs > 0 && ` · ${fmtMs(s.durMs)}`}
              </p>
              {s.chips.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.chips.map(c => (
                    <span
                      key={c.label}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ color: c.color, backgroundColor: `${c.color}1a` }}
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs font-semibold text-amber-400/80 tabular-nums shrink-0">+{s.log.totalPoints}pts</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SectionHeading ───────────────────────────────────────────────────────────

function SectionHeading({ children, count, icon }: { children: React.ReactNode; count?: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-zinc-700 shrink-0">{icon}</span>}
        <h2 className="text-[11px] font-semibold text-zinc-400 tracking-tight">{children}</h2>
      </div>
      {count !== undefined && (
        <span className="text-xs font-bold text-zinc-400 tabular-nums">{count}</span>
      )}
    </div>
  );
}

// ─── Progress Level System ────────────────────────────────────────────────────
// Level defs + progress maths live in feature/aiSummary/utils/milestoneLogic so
// the sidebar "unclaimed reward" indicator shares the exact same rules.

// ─── PracticeProgressTracker ──────────────────────────────────────────────────

const R_NORMAL = 24;
const R_ACTIVE = 30;

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
  const nextLevel   = levelStatuses[activeIdx];

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // keep the focused level centered in the horizontal scroll strip
  useEffect(() => {
    const node = activeRef.current;
    const container = scrollRef.current;
    if (!node || !container) return;
    const target = node.offsetLeft - container.clientWidth / 2 + node.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeIdx]);

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg bg-zinc-800/40 backdrop-blur-sm shadow-sm px-4 py-5">
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => onPreviewChange(Math.max(0, activeIdx - 1))}
          disabled={activeIdx === 0}
          aria-label="Previous level"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 transition-colors hover:bg-zinc-700 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <span className="text-sm font-semibold text-zinc-300 tabular-nums">{activeIdx + 1} / {LEVELS.length}</span>
        <button
          onClick={() => onPreviewChange(Math.min(LEVELS.length - 1, activeIdx + 1))}
          disabled={activeIdx === LEVELS.length - 1}
          aria-label="Next level"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 transition-colors hover:bg-zinc-700 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronRight size={26} strokeWidth={2.5} />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex w-full items-center overflow-x-auto no-scrollbar snap-x snap-mandatory sm:snap-none sm:overflow-x-visible"
      >
      {levelStatuses.map((level, idx) => {
        const isOwned     = ownedSet.has(level.id);
        const isClaimed   = claimedSet.has(level.id);
        const isClaimable = level.met && isOwned && !isClaimed;   // reward waiting to collect
        const isNext      = level.id === nextLevel?.id;
        const isDim     = !level.met && !isNext;
        const baseColor = LEVEL_COLORS[level.id - 1];
        const GREEN     = "#22c55e";
        const ringColor = level.met ? GREEN : baseColor;   // completed rings turn green
        const R         = isNext ? R_ACTIVE : R_NORMAL;
        const SIZE      = R * 2 + 12;
        const CX        = SIZE / 2;
        const CY        = SIZE / 2;
        const CIRC      = 2 * Math.PI * R;
        const pct       = level.progress.max > 0 ? level.progress.value / level.progress.max : 0;
        const offset    = CIRC - (level.met ? 1 : pct) * CIRC;
        const strokeW   = isNext ? 5 : 4;
        const showLock  = !isOwned && level.cost > 0;
        const ringClass = isNext
          ? "w-[58px] h-[58px] sm:w-[68px] sm:h-[68px]"
          : "w-12 h-12 sm:w-14 sm:h-14";
        const iconClass = isNext ? "w-6 h-6 sm:w-7 sm:h-7" : "w-5 h-5 sm:w-6 sm:h-6";

        return (
          <div
            key={level.id}
            ref={idx === activeIdx ? activeRef : undefined}
            className="flex shrink-0 w-[68px] flex-col items-center gap-2 snap-center cursor-pointer sm:w-auto sm:flex-1 sm:min-w-0"
            style={{ opacity: showLock ? 0.6 : isDim ? 0.7 : 1 }}
            onClick={() => onPreviewChange(idx)}
          >
            <div className={`relative flex shrink-0 items-center justify-center ${ringClass}`}>
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke={showLock ? "#3f3f46" : "#52525b"}
                  strokeWidth={strokeW}
                  strokeDasharray={showLock ? "3 3" : undefined}
                />
                {!showLock && (level.met || pct > 0) && (
                  <circle
                    cx={CX} cy={CY} r={R}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={offset}
                  />
                )}
              </svg>
              <div className="relative flex items-center justify-center">
                {showLock ? (
                  <Lock className={`${iconClass} text-zinc-400`} />
                ) : level.met ? (
                  <CheckCircle2 className={iconClass} style={{ color: GREEN }} />
                ) : (
                  <level.Icon className={iconClass} style={{ color: isNext ? baseColor : "#a1a1aa" }} />
                )}
              </div>

              {/* reward status: amber pulse = uncollected reward, emerald = claimed */}
              {isClaimable && (
                <span
                  aria-label="Reward ready to claim"
                  className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 animate-pulse ring-2 ring-zinc-800/40"
                />
              )}
              {isClaimed && (
                <span
                  aria-label="Reward claimed"
                  className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-zinc-800/40"
                >
                  <Check size={9} strokeWidth={3.5} className="text-zinc-950" />
                </span>
              )}
            </div>

            <span
              className="w-full px-0.5 text-center text-[11px] font-semibold leading-tight truncate"
              style={{ color: showLock ? "#a1a1aa" : level.met ? GREEN : isNext ? "#fafafa" : "#d4d4d8" }}
              title={level.name}
            >
              {level.short ?? level.name.split(" ")[0]}
            </span>
          </div>
        );
      })}
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
  logs, today, selectedDate, displayDate, onSelectDay, onPeekDay, previewIdx,
  isOwned, isClaimedThisWeek, fame, busy, onPurchase, onClaim,
}: {
  logs: FirebaseUserExceriseLog[];
  today: Date;
  selectedDate: Date;
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

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

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

  // categories only (level 5)
  const catBars = CATS.map(cat => ({
    ...cat,
    active: weekDays.some(d => (byDate.get(localDateStr(d))?.[cat.k] ?? 0) > 0),
  }));

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
    actionButton = (
      <div
        className={`${btnBase} cursor-default`}
        style={{ backgroundColor: "#18181b", color: "#71717a", border: "2px solid #27272a" }}
      >
        <CheckCircle2 size={18} className="text-emerald-500/70" />
        <span>Claimed this week</span>
      </div>
    );
  } else if (isOwned && !isMet) {
    // reward is always visible as a button — locked until the goal is met
    actionButton = (
      <button
        disabled
        className={`${btnBase} cursor-not-allowed`}
        style={{ backgroundColor: "#27272a", color: "#a1a1aa", border: "2px solid #3f3f46" }}
      >
        <Lock size={18} />
        <span>Claim</span>
        <img src="/images/coin.png" alt="Fame" className="h-5 w-5 object-contain opacity-70" />
        <span className="tabular-nums">+{nextLevel.reward}</span>
        <span className="text-xs font-medium text-zinc-500">— reach your goal</span>
      </button>
    );
  }

  // Highlighted objective + completion checkbox (reused for locked & unlocked)
  const goalAccent = isMet ? "#22c55e" : color;
  const goalBox = (
    <div
      className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 transition-colors"
      style={{ backgroundColor: `${goalAccent}14`, border: `1px solid ${goalAccent}40` }}
    >
      {/* checkbox */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all"
        style={{
          backgroundColor: isMet ? goalAccent : "transparent",
          border: `2px solid ${isMet ? goalAccent : "#52525b"}`,
          boxShadow: isMet ? `0 0 8px ${goalAccent}66` : undefined,
        }}
      >
        {isMet && <Check size={18} strokeWidth={3} className="text-zinc-950" />}
      </div>
      <div className="min-w-0 flex-1 text-left leading-tight">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${goalAccent}dd` }}>
          {isMet ? "Goal complete" : "Your goal"}
        </p>
        <p className="text-sm font-semibold text-zinc-100">{nextLevel.req}</p>
      </div>
      {isMet && <Target size={18} className="shrink-0" style={{ color: goalAccent }} />}
    </div>
  );

  return (
    <div className="rounded-lg bg-zinc-800/40 backdrop-blur-sm shadow-sm p-4 sm:p-5 space-y-5">
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
          <div>
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
            <div className="flex items-end gap-1 sm:gap-2">
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
            <p className="mt-3 flex items-center gap-1.5 text-[11px] leading-snug text-zinc-500">
              <CheckCircle2 size={12} style={{ color: GREEN }} className="shrink-0" />
              <span>Each day with <span className="font-semibold text-zinc-300">{dayGoalMin}+ min</span> of practice counts — green bars are days you completed.</span>
            </p>
          </div>
        );
      })()}

      {/* ── streak-simple (levels 3,5) ── */}
      {!isLocked && levelType === "streak-simple" && (
        <div className="space-y-4">
          <div className="flex gap-1 sm:gap-1.5">
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
        <div className="space-y-4">
          <div className="flex gap-1 sm:gap-1.5">
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
        <div className="space-y-4">
          <div className="flex gap-1 sm:gap-1.5">
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
        <div className="flex flex-col items-center gap-5 py-4">
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
      ) : (
        <>
          {goalBox}
          {actionButton && (
            <div className="flex items-center justify-center sm:justify-end pt-1 border-t border-zinc-800/60 -mx-4 -mb-4 px-4 sm:-mx-5 sm:-mb-5 sm:px-5 py-3.5 mt-1">
              {actionButton}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── RulesAlert ───────────────────────────────────────────────────────────────

const RULES_DISMISSED_KEY = "practiceLevels.rulesDismissed";

// One worked example (the Groove level from the Discord thread): pay 40 once,
// earn +30 every week — turns positive in week 2 and keeps growing.
const EXAMPLE_STEPS: { label: string; net: string; positive?: boolean; note?: string }[] = [
  { label: "Unlock",  net: "−40" },
  { label: "Week 1",  net: "−10" },
  { label: "Week 2",  net: "+20", positive: true, note: "Paid back" },
  { label: "Week 3",  net: "+50", positive: true },
  { label: "…onward", net: "+30/wk", positive: true },
];

function RulesAlert() {
  const [dismissed, setDismissed] = useState(true);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    setDismissed(localStorage.getItem(RULES_DISMISSED_KEY) === "1");
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(RULES_DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const steps = [
    {
      Icon: Lock,
      title: "Unlock once",
      desc: <>Pay Fame once to keep a level for good.<span className="text-zinc-500"> First one is free.</span></>,
    },
    {
      Icon: CheckCircle2,
      title: "Practice",
      desc: <>Hit that level&apos;s weekly goal.</>,
    },
    {
      Icon: Sparkles,
      title: "Claim weekly",
      desc: <>Collect the Fame reward — again every week.</>,
    },
  ];

  return (
    <div className="relative rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 pr-10">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <p className="mb-4 flex items-center gap-2 text-base font-bold text-amber-200">
        <Info size={18} className="text-amber-400" />
        How it works
      </p>

      {/* 3 simple steps */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <s.Icon size={19} />
              <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-zinc-950">
                {i + 1}
              </span>
            </div>
            <div className="min-w-0 leading-snug">
              <p className="text-sm font-bold text-zinc-100">{s.title}</p>
              <p className="text-[13px] text-zinc-300">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Worked example — watch the balance flip positive in week 2 */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setReplayKey(k => k + 1)}
          className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-amber-200/80 transition-colors hover:text-amber-200"
          aria-label="Replay example"
        >
          Example: unlock 40, earn +30 / week
          <Sparkles size={12} className="text-amber-400" />
        </button>
        <div key={replayKey} className="flex items-stretch gap-1.5">
          {EXAMPLE_STEPS.map((s, i) => (
            <div
              key={i}
              className={cn(
                "flex min-w-0 flex-1 animate-in fade-in-0 slide-in-from-bottom-2 flex-col items-center justify-center gap-0.5 rounded px-1 py-2 text-center",
                s.positive ? "bg-emerald-500/10" : "bg-zinc-800/40"
              )}
              style={{
                animationDelay: `${i * 240}ms`,
                animationDuration: "450ms",
                animationFillMode: "both",
              }}
            >
              <span className="truncate text-[10px] font-semibold text-zinc-400">{s.label}</span>
              <span className={cn("text-sm font-black tabular-nums", s.positive ? "text-emerald-400" : "text-zinc-200")}>
                {s.net}
              </span>
              {s.note && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400">
                  <Check size={10} strokeWidth={3} />{s.note}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-zinc-400">
        <img src="/images/coin.png" alt="Fame" className="h-4 w-4 object-contain" />
        <span>Everything resets every weekend — your goals and claims start fresh each new week. One claim per level a week; higher levels pay more.</span>
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

  const [logs, setLogs]               = useState<FirebaseUserExceriseLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

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
    firebaseGetUserRaprotsLogs(userAuth, new Date().getFullYear())
      .then(setLogs)
      .finally(() => setLogsLoading(false));
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

  const displayLogs = logs.filter(l => isSameDay(new Date(l.reportDate.seconds * 1000), displayDate));

  const subtitleDate = displayDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="flex w-full flex-col">
      <HeroBanner
        title="Milestones"
        subtitle={subtitleDate}
        eyebrow="Practice"
        backgroundContent={<HeroPattern />}
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">

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
          selectedDate={selectedDate}
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

        {/* Sessions — fixed min height so hovering days never collapses the box */}
        <div>
          <SectionHeading icon={<ListMusic size={16} />} count={displayLogs.length}>
            Sessions
          </SectionHeading>
          <div className="min-h-[320px]">
            {/* keyed on the shown day so the content fades/slides in on every change */}
            <div
              key={localDateStr(displayDate)}
              className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
            >
              {displayLogs.length > 0 ? (
                <DayTimeline logs={displayLogs} />
              ) : !logsLoading ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-800">
                  <Guitar className="h-10 w-10 text-zinc-700 opacity-40" />
                  <p className="text-sm font-medium text-zinc-500">
                    {isSameDay(displayDate, today) ? "No practice logged today" : "No sessions on this day"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
