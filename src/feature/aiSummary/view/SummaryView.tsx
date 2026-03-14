import { HeroBanner } from "components/UI/HeroBanner";
import { cn } from "assets/lib/utils";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import {
  BarChart2, Brain, Calendar, CalendarDays, CheckCircle2, ChevronDown, Clock,
  Flame, Guitar, Headphones, Lightbulb, ListMusic, Music2,
  Settings, Sparkles, Star, Target, TrendingDown, TrendingUp, TriangleAlert, Trophy, X, Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { WeeklySummaryResponse } from "../types/summary.types";
import { DailyAssessmentCard, PeriodRatingCard } from "../components/SessionRatingCard";
import { firebaseGetAllDailySummaries, firebaseGetAllSummaries, firebaseGetDailySummary, firebaseGetPromptConfig, firebaseGetSummary, firebaseSaveDailySummary, firebaseSavePromptConfig, firebaseSaveSummary } from "../services/summary.service";
import { firebaseGetAllDailyRatings } from "../services/rating.service";
import type { SavedDailySummary, SavedSummary } from "../services/summary.service";
import type { DailySummaryResponse, PromptConfig, SessionGrade } from "../types/summary.types";

const GOAL_MAX_LENGTH = 150;
const DEFAULT_PROMPT_CONFIG: PromptConfig = { practiceStyle: "hobby", goal: "" };

// ─── helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fmtMs(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function fmtMinAsTime(minutes: number) {
  return fmtMs(minutes * 60000);
}

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function weekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

// ─── mood config ──────────────────────────────────────────────────────────────

const MOOD_CFG: Record<DailySummaryResponse["mood"], { label: string; chip: string; accent: string }> = {
  excellent: { label: "Excellent session",   chip: "bg-orange-500/10 text-orange-400 border-orange-500/25",   accent: "border-orange-500/40" },
  good:      { label: "Good practice",       chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", accent: "border-emerald-500/40" },
  solid:     { label: "Solid session",       chip: "bg-main/10 text-main border-main/25",                       accent: "border-main/40" },
  light:     { label: "Light practice",      chip: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",    accent: "border-yellow-500/40" },
  rest:      { label: "Rest day",            chip: "bg-zinc-800 text-zinc-500 border-zinc-700",                accent: "border-zinc-700/60" },
};

// ─── week config ──────────────────────────────────────────────────────────────

const WEEK_CFG = {
  excellent:    { label:"Exceptional week", chip:"bg-orange-500/10 text-orange-400 border-orange-500/25",   accent:"border-l-orange-500" },
  strong:       { label:"Strong week",      chip:"bg-emerald-500/10 text-emerald-400 border-emerald-500/25",accent:"border-l-emerald-500" },
  good:         { label:"Good progress",    chip:"bg-main/10 text-main border-main/25",                      accent:"border-l-main" },
  inconsistent: { label:"Inconsistent",     chip:"bg-yellow-500/10 text-yellow-400 border-yellow-500/25",   accent:"border-l-yellow-500" },
  minimal:      { label:"Minimal practice", chip:"bg-zinc-800 text-zinc-500 border-zinc-700",               accent:"border-l-zinc-700" },
} satisfies Record<WeeklySummaryResponse["weekScore"], { label:string; chip:string; accent:string }>;

// ─── Day activity dot color ────────────────────────────────────────────────────

function dayDotClass(minutes: number): string {
  if (minutes === 0)          return "bg-zinc-800 border border-zinc-700";
  if (minutes < 15)           return "bg-yellow-500/40 border border-yellow-500/30";
  if (minutes < 30)           return "bg-yellow-500/70 border border-yellow-500/50";
  if (minutes < 60)           return "bg-main/60 border border-main/40";
  if (minutes < 120)          return "bg-emerald-500/70 border border-emerald-500/50";
  return "bg-orange-500/80 border border-orange-500/60";
}

// ─── DayActivityStrip ─────────────────────────────────────────────────────────

const DAY_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const GRADE_DOT_TEXT: Record<SessionGrade, string> = {
  S: "text-amber-300", "A+": "text-emerald-300", A: "text-emerald-400",
  "A-": "text-emerald-400", "B+": "text-main-300", B: "text-main",
  "B-": "text-main", "C+": "text-yellow-300", C: "text-yellow-400",
  D: "text-orange-400", F: "text-red-400",
};

const GRADE_RING_COLOR: Record<SessionGrade, string> = {
  S:   "#f59e0b",
  "A+":"#10b981", A: "#10b981", "A-":"#34d399",
  "B+":"#0891B2", B: "#0891B2", "B-":"#67e8f9",
  "C+":"#fbbf24", C: "#fbbf24",
  D:   "#f97316",
  F:   "#ef4444",
};

const GRADE_RING_PCT: Record<SessionGrade, number> = {
  S: 1.0,
  "A+": 0.95, A: 0.90, "A-": 0.85,
  "B+": 0.80, B: 0.75, "B-": 0.70,
  "C+": 0.65, C: 0.60,
  D: 0.45,
  F: 0.25,
};

function minutesRingColor(minutes: number): string {
  if (minutes === 0)   return "#3f3f46";
  if (minutes < 15)    return "#eab308";
  if (minutes < 30)    return "#eab308";
  if (minutes < 60)    return "#0891B2";
  if (minutes < 120)   return "#10b981";
  return "#f97316";
}

const DAY_RING_R = 20;
const DAY_RING_CIRC = 2 * Math.PI * DAY_RING_R;

function DayActivityStrip({
  logs, today, ratings = {}, selectedDate, onSelectDay,
}: {
  logs: FirebaseUserExceriseLog[];
  today: Date;
  ratings?: Record<string, SessionGrade>;
  selectedDate: Date;
  onSelectDay: (d: Date) => void;
}) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    d.setHours(0,0,0,0);
    return d;
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-4">
      <div className="flex items-end gap-2 min-w-0">
        {days.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday    = isSameDay(day, today);
          const dayLogs    = logs.filter(l => isSameDay(new Date(l.reportDate.seconds * 1000), day));
          const minutes    = Math.round(dayLogs.reduce((s, l) => s + (l.timeSumary?.sumTime || 0), 0) / 60000);
          const dateKey    = localDateStr(day);
          const grade      = ratings[dateKey];
          const shortName  = DAY_SHORT[day.getDay()];
          const dayNum     = day.getDate();

          const ringColor = grade ? GRADE_RING_COLOR[grade] : minutesRingColor(minutes);
          const ringPct   = grade ? GRADE_RING_PCT[grade] : Math.min(minutes / 90, 1);
          const offset    = DAY_RING_CIRC - ringPct * DAY_RING_CIRC;
          const hasActivity = minutes > 0;

          return (
            <div
              key={i}
              className={cn("flex flex-col items-center gap-1.5 flex-1 min-w-[48px] cursor-pointer group/dot")}
              onClick={() => onSelectDay(day)}
            >
              <span className={cn("text-[10px] font-semibold uppercase tracking-wide transition-colors", isSelected ? "text-zinc-200" : "text-zinc-600 group-hover/dot:text-zinc-400")}>
                {shortName}
              </span>

              {/* Ring */}
              <div className={cn("relative flex items-center justify-center w-12 h-12 shrink-0 transition-opacity")}>
                <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full -rotate-90" overflow="visible">
                  {/* Selection outer glow */}
                  {isSelected && (
                    <circle cx="24" cy="24" r={DAY_RING_R + 4} fill="none" stroke="#ffffff18" strokeWidth="1.5" />
                  )}
                  {/* Track */}
                  <circle cx="24" cy="24" r={DAY_RING_R} fill="none" stroke="#27272a" strokeWidth="3.5" />
                  {/* Progress */}
                  {hasActivity && (
                    <circle
                      cx="24" cy="24" r={DAY_RING_R}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={DAY_RING_CIRC}
                      strokeDashoffset={offset}
                      style={{ filter: `drop-shadow(0 0 4px ${ringColor}80)` }}
                    />
                  )}
                </svg>
                <div className="relative flex flex-col items-center justify-center">
                  {grade ? (
                    <span className={cn("text-xs font-black leading-none", GRADE_DOT_TEXT[grade])}>
                      {grade}
                    </span>
                  ) : minutes > 0 ? (
                    <span className="text-[10px] font-bold text-white/70 tabular-nums leading-none">
                      {minutes >= 60 ? `${Math.floor(minutes/60)}h` : `${minutes}m`}
                    </span>
                  ) : null}
                </div>
              </div>

              <span className={cn("text-[10px] tabular-nums transition-colors", isSelected ? "text-zinc-300" : "text-zinc-600 group-hover/dot:text-zinc-500")}>
                {dayNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ActivityHeatmap ─────────────────────────────────────────────────────────

const WEEK_DOT_TEXT: Record<WeeklySummaryResponse["weekScore"], string> = {
  excellent:    "text-orange-400",
  strong:       "text-emerald-400",
  good:         "text-main",
  inconsistent: "text-yellow-400",
  minimal:      "text-zinc-500",
};

function ActivityHeatmap({
  logs, today, summaries, weekOffset, onSelectWeek,
}: {
  logs: FirebaseUserExceriseLog[];
  today: Date;
  summaries: SavedSummary[];
  weekOffset: number;
  onSelectWeek: (offset: number) => void;
}) {
  const WEEKS = 8;
  const DAY_ABBR = ["Mo","Tu","We","Th","Fr","Sa","Su"];

  const weeks = Array.from({ length: WEEKS }, (_, col) => {
    const offset = WEEKS - col; // col 0 = oldest (offset 8), col 7 = newest (offset 1)
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((currentDay === 0 ? 6 : currentDay - 1) + offset * 7));
    monday.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, dayIdx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + dayIdx);
      const dayLogs = logs.filter(l => isSameDay(new Date(l.reportDate.seconds * 1000), d));
      const totalMin = Math.round(dayLogs.reduce((s, l) => s + (l.timeSumary?.sumTime || 0), 0) / 60000);
      return { date: d, totalMin };
    });

    const weekId = `weekly-${localDateStr(monday)}`;
    const saved = summaries.find(s => s.id.startsWith(weekId));
    const monthLabel = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return { offset, monday, days, saved, monthLabel };
  });

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-4">
      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 shrink-0">
          {DAY_ABBR.map(d => (
            <div key={d} className="h-5 flex items-center">
              <span className="text-[10px] text-zinc-600 font-medium w-5">{d}</span>
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex gap-1.5 flex-1 min-w-0">
          {weeks.map(w => {
            const isSelected = weekOffset === w.offset;
            const scoreKey = w.saved?.summary.weekScore;
            return (
              <div
                key={w.offset}
                className={cn(
                  "flex flex-col gap-1 flex-1 min-w-[24px] cursor-pointer rounded-lg px-0.5 pt-0.5 pb-1 transition-all",
                  isSelected ? "bg-zinc-800/80 ring-1 ring-zinc-600/60" : "hover:bg-zinc-800/40"
                )}
                onClick={() => onSelectWeek(w.offset)}
              >
                {w.days.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={cn(
                      "h-5 w-full rounded-sm transition-all",
                      dayDotClass(day.totalMin).split(" ").find(c => c.startsWith("bg-")) ?? "bg-zinc-800"
                    )}
                    title={`${day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${day.totalMin > 0 ? fmtMinAsTime(day.totalMin) : "no practice"}`}
                  />
                ))}
                <span className={cn(
                  "text-[10px] tabular-nums font-medium text-center mt-0.5 truncate transition-colors block",
                  isSelected ? "text-zinc-300" : scoreKey ? WEEK_DOT_TEXT[scoreKey] : "text-zinc-700"
                )}>
                  {w.monthLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── WeekDayGrid ──────────────────────────────────────────────────────────────

function WeekDayGrid({ weekDays }: { weekDays: { date: Date; dayName: string; totalMinutes: number; totalPoints: number }[] }) {
  const maxMin = Math.max(...weekDays.map(d => d.totalMinutes), 1);
  const DAY_ABBR = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div className="grid grid-cols-7 gap-2 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 px-4 py-4">
      {weekDays.map((d, i) => {
        const barH = Math.max(Math.round((d.totalMinutes / maxMin) * 64), d.totalMinutes > 0 ? 6 : 2);
        const dotCls = dayDotClass(d.totalMinutes).split(" ").find(c => c.startsWith("bg-")) ?? "bg-zinc-700";

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">{DAY_ABBR[i]}</span>
            <div className="flex items-end w-full justify-center h-16">
              <div
                className={cn("w-full rounded-lg transition-all", dotCls)}
                style={{ height: `${barH}px`, maxHeight: "64px" }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 tabular-nums font-medium">
              {d.totalMinutes > 0 ? fmtMinAsTime(d.totalMinutes) : "–"}
            </span>
            {d.totalPoints > 0 && (
              <span className="text-[10px] text-amber-400/80 tabular-nums font-semibold">+{d.totalPoints}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatStrip({ stats }: {
  stats: { icon: React.ReactNode; value: string; label: string; trend?: { diff: string; positive: boolean | null } }[]
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5">
          <div className="flex items-center gap-2 text-zinc-500">
            {s.icon}
            <span className="text-xs font-medium uppercase tracking-wide">{s.label}</span>
          </div>
          <p className="text-3xl font-bold text-zinc-100 tabular-nums leading-none">{s.value}</p>
          {s.trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold leading-none",
              s.trend.positive === true ? "text-emerald-400" :
              s.trend.positive === false ? "text-red-400" : "text-zinc-600"
            )}>
              {s.trend.positive === true
                ? <TrendingUp size={13}/>
                : s.trend.positive === false
                ? <TrendingDown size={13}/>
                : <span className="w-[10px] text-center">–</span>}
              <span>{s.trend.diff}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children, count, icon }: { children: React.ReactNode; count?: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2 tracking-tight">
        {icon && <span className="text-zinc-500 shrink-0">{icon}</span>}
        {children}
      </h2>
      {count !== undefined && (
        <span className="text-xs font-medium text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-md tabular-nums mt-0.5">{count}</span>
      )}
    </div>
  );
}

// ─── Category bars ────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { bar: string; text: string }> = {
  "text-red-400":     { bar: "bg-red-500",    text: "text-red-400" },
  "text-main":        { bar: "bg-main",        text: "text-main" },
  "text-emerald-400": { bar: "bg-emerald-500", text: "text-emerald-400" },
  "text-amber-400":   { bar: "bg-amber-500",   text: "text-amber-400" },
};

function CategoryBars({ rows }: {
  rows: { label: string; value: number; total: number; color: string; icon: React.ReactNode }[]
}) {
  const visible = rows.filter(r => r.value > 0);
  if (!visible.length) return null;
  return (
    <div className="space-y-3">
      {visible.map(r => {
        const pct = Math.min(Math.round((r.value / r.total) * 100), 100);
        const c = CAT_COLORS[r.color] ?? { bar:"bg-zinc-500", text:"text-zinc-400" };
        return (
          <div key={r.label} className="flex items-center gap-3">
            <div className={cn("flex items-center gap-1.5 w-24 shrink-0", c.text)}>
              {r.icon}
              <span className="text-xs font-medium">{r.label}</span>
            </div>
            <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-700", c.bar)} style={{ width:`${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-zinc-400 w-12 text-right tabular-nums">{fmtMs(r.value)}</span>
            <span className="text-[10px] text-zinc-600 w-7 text-right tabular-nums">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Day timeline ─────────────────────────────────────────────────────────────

const SESSION_PALETTE = ["#10b981", "#0891B2", "#e5626b", "#f59e0b", "#f97316", "#ec4899"];

function DayTimeline({ logs }: { logs: FirebaseUserExceriseLog[] }) {
  if (!logs.length) return null;

  const sessions = logs.map((log, i) => {
    const endMs    = log.reportDate.seconds * 1000;
    const durMs    = log.timeSumary?.sumTime || 0;
    const startMs  = endMs - durMs;
    // Use end time as the pin position (when session was logged)
    const pinMin   = new Date(endMs).getHours() * 60 + new Date(endMs).getMinutes();
    const color    = SESSION_PALETTE[i % SESSION_PALETTE.length];
    const tech    = log.timeSumary?.techniqueTime  || 0;
    const theory  = log.timeSumary?.theoryTime     || 0;
    const hearing = log.timeSumary?.hearingTime    || 0;
    const creat   = log.timeSumary?.creativityTime || 0;
    const chips = [
      tech    && { label:"Tech",       val:tech,    cls:"text-red-400 bg-red-500/10" },
      theory  && { label:"Theory",     val:theory,  cls:"text-main bg-main/10" },
      hearing && { label:"Ear",        val:hearing, cls:"text-emerald-400 bg-emerald-500/10" },
      creat   && { label:"Creativity", val:creat,   cls:"text-amber-400 bg-amber-500/10" },
    ].filter(Boolean) as { label:string; val:number; cls:string }[];
    return { log, startMs, endMs, pinMin, durMs, color, chips };
  });

  const fmt = (ms: number) =>
    new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  // Smart hour range
  const allMins    = sessions.map(s => s.pinMin);
  const rangeStart = Math.max(0,    Math.floor((Math.min(...allMins) - 60) / 60) * 60);
  const rangeEnd   = Math.min(1440, Math.ceil ((Math.max(...allMins) + 60) / 60) * 60);
  const rangeDur   = Math.max(rangeEnd - rangeStart, 1);

  const VW = 1000;
  // Pins: alternating tall (TALL) / short (SHORT) heights above axis
  const AXIS_Y  = 90;
  const TALL    = 65;
  const SHORT   = 38;
  const R       = 12;   // circle radius
  const LABEL_Y = AXIS_Y + 20;
  const VH      = LABEL_Y + 8;

  const toX = (min: number) => ((min - rangeStart) / rangeDur) * VW;

  const hourMarks = Array.from(
    { length: Math.floor(rangeDur / 60) + 1 },
    (_, i) => rangeStart + i * 60
  );

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
      {/* SVG chart */}
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

          {/* Axis base line */}
          <line x1={0} y1={AXIS_Y} x2={VW} y2={AXIS_Y} stroke="#3f3f46" strokeWidth="1.5" />

          {/* Hour ticks + labels */}
          {hourMarks.map(m => (
            <g key={m}>
              <line x1={toX(m)} y1={AXIS_Y - 4} x2={toX(m)} y2={AXIS_Y + 4}
                stroke="#52525b" strokeWidth="1.5" />
              <text x={toX(m)} y={LABEL_Y} textAnchor="middle" fontSize="10" fill="#52525b">
                {`${String(Math.floor(m / 60)).padStart(2, "0")}:00`}
              </text>
            </g>
          ))}

          {/* Session pins */}
          {sessions.map((s, i) => {
            const x      = toX(s.pinMin);
            const pinH   = i % 2 === 0 ? TALL : SHORT;
            const pinTop = AXIS_Y - pinH;
            const cx     = x;
            const cy     = pinTop;
            return (
              <g key={i}>
                {/* glow circle behind */}
                <circle cx={cx} cy={cy} r={R + 4} fill={s.color} opacity="0.15" />
                {/* stem */}
                <line x1={cx} y1={cy + R} x2={cx} y2={AXIS_Y}
                  stroke={s.color} strokeWidth="2" strokeDasharray="3,2" opacity="0.6" />
                {/* axis dot */}
                <circle cx={cx} cy={AXIS_Y} r="3.5" fill={s.color} />
                {/* main circle */}
                <circle cx={cx} cy={cy} r={R} fill={`url(#pin-grad-${i})`} />
                <circle cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.5" />
                {/* number */}
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Session cards — 2-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800/40">
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-zinc-900/80">
            {/* Number badge */}
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
                {fmt(s.endMs)}
                {s.durMs > 0 && ` · ${fmtMs(s.durMs)}`}
              </p>
              {s.chips.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.chips.map(c => (
                    <span key={c.label} className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", c.cls)}>
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

// ─── Session row ──────────────────────────────────────────────────────────────

function SessionRow({ log }: { log: FirebaseUserExceriseLog }) {
  const total   = log.timeSumary?.sumTime        || 0;
  const tech    = log.timeSumary?.techniqueTime  || 0;
  const theory  = log.timeSumary?.theoryTime     || 0;
  const hearing = log.timeSumary?.hearingTime    || 0;
  const creat   = log.timeSumary?.creativityTime || 0;

  const chips = [
    tech    && { label:"Tech",       val:tech,    cls:"text-red-400 bg-red-500/10" },
    theory  && { label:"Theory",     val:theory,  cls:"text-main bg-main/10" },
    hearing && { label:"Ear",        val:hearing, cls:"text-emerald-400 bg-emerald-500/10" },
    creat   && { label:"Creativity", val:creat,   cls:"text-amber-400 bg-amber-500/10" },
  ].filter(Boolean) as { label:string; val:number; cls:string }[];

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800 transition-all duration-150">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
        {log.songTitle
          ? <Guitar size={13} className="text-zinc-500" />
          : <Zap size={13} className="text-zinc-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate leading-tight">
          {log.exceriseTitle || "Practice session"}
        </p>
        {log.songTitle && (
          <p className="text-xs text-zinc-600 truncate mt-0.5">
            {log.songArtist ? `${log.songArtist} — ` : ""}{log.songTitle}
          </p>
        )}
        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map(c => (
              <span key={c.label} className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", c.cls)}>
                {c.label} · {fmtMs(c.val)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-zinc-300 tabular-nums">{fmtMs(total)}</p>
        <p className="text-[10px] text-amber-400/80 font-semibold tabular-nums mt-0.5">+{log.totalPoints} pts</p>
      </div>
    </div>
  );
}

// ─── Points line chart (30 days) ──────────────────────────────────────────────

function PointsChart({ logs, today }: { logs: FirebaseUserExceriseLog[]; today: Date }) {
  const DAYS = 7;
  const VW = 600, VH = 140, PAD_T = 12, PAD_B = 24;

  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const data = days.map((day, i) => ({
    day,
    pts: logs
      .filter(l => isSameDay(new Date(l.reportDate.seconds * 1000), day))
      .reduce((s, l) => s + (l.totalPoints || 0), 0),
    x: i * (VW / (DAYS - 1)),
  }));

  const maxPts = Math.max(...data.map(d => d.pts), 1);
  const cH = VH - PAD_T - PAD_B;
  const pts = data.map(d => ({ ...d, y: PAD_T + cH - (d.pts / maxPts) * cH }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L${pts[DAYS - 1].x.toFixed(1)},${VH - PAD_B} L0,${VH - PAD_B} Z`;

  const activeDays = data.filter(d => d.pts > 0).length;
  const totalPts   = data.reduce((s, d) => s + d.pts, 0);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 px-5 pt-5 pb-4 relative">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <TrendingUp size={14} className="text-zinc-500"/>
          Points — last 7 days
        </p>
        <div className="text-sm text-zinc-400">
          <span className="text-amber-400 font-semibold">{totalPts} pts</span>
          <span className="text-zinc-600 mx-1">·</span>
          <span>{activeDays} active day{activeDays !== 1 ? "s" : ""}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full overflow-visible" style={{ height: 140 }}>
        <defs>
          <linearGradient id="ptsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={VH - PAD_B} x2={VW} y2={VH - PAD_B} stroke="#27272a" strokeWidth="1" />
        <path d={fillPath} fill="url(#ptsFill)" />
        <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.filter(p => p.pts > 0).map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4.5" fill="#f59e0b" style={{ filter: "drop-shadow(0 0 4px #f59e0b80)" }} />
        ))}
        {data.map((d, idx) => (
          <text key={idx} x={pts[idx].x.toFixed(1)} y={VH} textAnchor="middle" fontSize="10" fill="#71717a">
            {d.day.toLocaleDateString("en-US", { weekday: "short" })}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── AI skeleton ──────────────────────────────────────────────────────────────

function AiSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({length: lines}).map((_, i) => (
        <div
          key={i}
          className={cn("h-3 rounded-full bg-zinc-800 animate-pulse", i === lines-1 ? "w-2/3" : "w-full")}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ─── Mode toggle ──────────────────────────────────────────────────────────────

type Mode = "daily" | "weekly";

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex gap-0.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
      {(["daily","weekly"] as Mode[]).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === m
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {m === "daily" ? <Calendar size={14}/> : <CalendarDays size={14}/>}
          {m === "daily" ? "Daily" : "Weekly"}
        </button>
      ))}
    </div>
  );
}

// ─── Coach section ────────────────────────────────────────────────────────────

function CoachSection({ icon, label, color, children }: {
  icon: React.ReactNode; label: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-800/60", color)}>
          {icon}
        </div>
        <p className="text-sm font-semibold text-zinc-100">{label}</p>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300 pl-9">{children}</p>
    </div>
  );
}

// ─── Best session card ────────────────────────────────────────────────────────

function BestSessionCard({ logs }: { logs: FirebaseUserExceriseLog[] }) {
  if (!logs.length) return null;
  const best = [...logs].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))[0];
  const total = best.timeSumary?.sumTime || 0;
  if (!total) return null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Trophy size={18} className="text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-widest mb-0.5">Best session this week</p>
        <p className="text-sm font-semibold text-zinc-200 truncate">{best.exceriseTitle || "Practice session"}</p>
        {best.songTitle && (
          <p className="text-xs text-zinc-600 truncate mt-0.5">
            {best.songArtist ? `${best.songArtist} — ` : ""}{best.songTitle}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-zinc-300 tabular-nums">{fmtMs(total)}</p>
        <p className="text-[10px] text-amber-400 font-semibold tabular-nums mt-0.5">+{best.totalPoints} pts</p>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export const SummaryView = () => {
  const [mode, setMode] = useState<Mode>("daily");
  const [showConfig, setShowConfig] = useState(false);
  const [promptConfig, setPromptConfig] = useState<PromptConfig>(DEFAULT_PROMPT_CONFIG);
  const userAuth  = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);

  const [logs, setLogs]               = useState<FirebaseUserExceriseLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [weekly, setWeekly]           = useState<WeeklySummaryResponse | null>(null);
  const [daily, setDaily]             = useState<DailySummaryResponse | null>(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [dailyAiLoading, setDailyAiLoading] = useState(false);
  const [history, setHistory]           = useState<SavedSummary[]>([]);
  const [dailyHistory, setDailyHistory] = useState<SavedDailySummary[]>([]);
  const [dailyRatings, setDailyRatings] = useState<Record<string, SessionGrade>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0,0,0,0);
    return d;
  });
  const [weekOffset, setWeekOffset] = useState(1); // 1 = last week, 2 = 2 weeks ago, …
  const loadedModes       = useRef<Set<Mode>>(new Set());
  const lastDailyDateRef  = useRef<string>("");
  const lastWeekIdRef     = useRef<string>("");

  useEffect(() => {
    if (!userAuth) return;
    firebaseGetPromptConfig(userAuth).then((config) => {
      if (config) setPromptConfig(config);
    });
  }, [userAuth]);

  useEffect(() => {
    if (!userAuth) return;
    firebaseGetUserRaprotsLogs(userAuth, new Date().getFullYear())
      .then(setLogs).finally(() => setLogsLoading(false));
  }, [userAuth]);

  useEffect(() => {
    if (!userAuth || mode !== "weekly") return;
    firebaseGetAllSummaries(userAuth).then(setHistory);
  }, [userAuth, mode]);

  useEffect(() => {
    if (!userAuth || mode !== "daily") return;
    firebaseGetAllDailySummaries(userAuth).then(setDailyHistory);
    firebaseGetAllDailyRatings(userAuth).then(setDailyRatings);
  }, [userAuth, mode]);

  const today = new Date();

  // ── derived daily ──
  const todayLogs   = logs.filter(l => isSameDay(new Date(l.reportDate.seconds * 1000), selectedDate));
  const todayTech   = todayLogs.reduce((s,l) => s + (l.timeSumary?.techniqueTime||0), 0);
  const todayTheory = todayLogs.reduce((s,l) => s + (l.timeSumary?.theoryTime||0), 0);
  const todayHear   = todayLogs.reduce((s,l) => s + (l.timeSumary?.hearingTime||0), 0);
  const todayCreat  = todayLogs.reduce((s,l) => s + (l.timeSumary?.creativityTime||0), 0);
  const todayTotal  = todayLogs.reduce((s,l) => s + (l.timeSumary?.sumTime||0), 0);
  const todayPts    = todayLogs.reduce((s,l) => s + (l.totalPoints||0), 0);

  // ── derived weekly ──
  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(today);
    const currentDay = d.getDay();
    const daysToLastMonday = (currentDay === 0 ? 6 : currentDay - 1) + weekOffset * 7;
    d.setDate(d.getDate() - daysToLastMonday + i);
    d.setHours(0,0,0,0);
    return d;
  });
  const weekDays = last7.map(dayStart => {
    const dl = logs.filter(l => isSameDay(new Date(l.reportDate.seconds*1000), dayStart));
    const totalMs = dl.reduce((s,l) => s+(l.timeSumary?.sumTime||0), 0);
    return {
      date:dayStart, dayName:DAY_NAMES[dayStart.getDay()],
      logs:dl, totalMinutes: Math.round(totalMs/60000),
      totalPoints: dl.reduce((s,l)=>s+(l.totalPoints||0),0),
      tech:       dl.reduce((s,l)=>s+(l.timeSumary?.techniqueTime||0),0),
      theory:     dl.reduce((s,l)=>s+(l.timeSumary?.theoryTime||0),0),
      hearing:    dl.reduce((s,l)=>s+(l.timeSumary?.hearingTime||0),0),
      creativity: dl.reduce((s,l)=>s+(l.timeSumary?.creativityTime||0),0),
    };
  });

  const weekTotalMin = weekDays.reduce((s,d)=>s+d.totalMinutes,0);
  const weekTotalPts = weekDays.reduce((s,d)=>s+d.totalPoints,0);
  const weekActive   = weekDays.filter(d=>d.totalMinutes>0).length;
  const weekTech     = weekDays.reduce((s,d)=>s+d.tech,0);
  const weekTheory   = weekDays.reduce((s,d)=>s+d.theory,0);
  const weekHear     = weekDays.reduce((s,d)=>s+d.hearing,0);
  const weekCreat    = weekDays.reduce((s,d)=>s+d.creativity,0);
  const weekCatTotal = weekTech+weekTheory+weekHear+weekCreat;

  // ── prev week for trend comparison ──
  const prevWeekLast7 = Array.from({length:7}, (_,i) => {
    const d = new Date(today);
    const currentDay = d.getDay();
    const daysToLastMonday = (currentDay === 0 ? 6 : currentDay - 1) + (weekOffset + 1) * 7;
    d.setDate(d.getDate() - daysToLastMonday + i);
    d.setHours(0,0,0,0);
    return d;
  });
  const prevWeekDays = prevWeekLast7.map(dayStart => {
    const dl = logs.filter(l => isSameDay(new Date(l.reportDate.seconds*1000), dayStart));
    return {
      totalMinutes: Math.round(dl.reduce((s,l) => s+(l.timeSumary?.sumTime||0), 0)/60000),
      totalPoints:  dl.reduce((s,l)=>s+(l.totalPoints||0),0),
    };
  });
  const prevWeekTotalMin = prevWeekDays.reduce((s,d)=>s+d.totalMinutes,0);
  const prevWeekTotalPts = prevWeekDays.reduce((s,d)=>s+d.totalPoints,0);
  const prevWeekActive   = prevWeekDays.filter(d=>d.totalMinutes>0).length;

  const mkTrend = (curr: number, prev: number, fmt: (n: number) => string) => {
    if (prev === 0 && curr === 0) return undefined;
    const diff = curr - prev;
    if (diff === 0) return { diff: "same as prev", positive: null as null };
    const sign = diff > 0 ? "+" : "−";
    return { diff: `${sign}${fmt(Math.abs(diff))} vs prev`, positive: diff > 0 };
  };

  // ── AI generation ──
  const summaryId      = `weekly-${localDateStr(last7[0])}-${promptConfig.practiceStyle}`;
  const dailySummaryId = `daily-${localDateStr(selectedDate)}-${promptConfig.practiceStyle}`;

  const generateAi = useCallback(async (force = false) => {
    if (!userAuth) return;

    if (!force) {
      const cached = await firebaseGetSummary(userAuth, summaryId);
      if (cached) {
        setWeekly(cached);
        loadedModes.current.add("weekly");
        return;
      }
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-weekly-summary", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          days: weekDays.map(d=>({
            dayName:d.dayName, date:localDateStr(d.date),
            exercises: d.logs.map(l=>({
              title:l.exceriseTitle||"Practice session", totalTime:l.timeSumary?.sumTime||0,
              techniqueTime:l.timeSumary?.techniqueTime||0, theoryTime:l.timeSumary?.theoryTime||0,
              hearingTime:l.timeSumary?.hearingTime||0,     creativityTime:l.timeSumary?.creativityTime||0,
              points:l.totalPoints||0, songTitle:l.songTitle,
            })),
            totalMinutes:d.totalMinutes, totalPoints:d.totalPoints,
          })),
          streak:userStats?.actualDayWithoutBreak||0, userLevel:userStats?.lvl||1, weekTotalPoints:weekTotalPts,
          practiceStyle: promptConfig.practiceStyle, goal: promptConfig.goal,
        }),
      });
      if (res.ok) {
        const data = await res.json() as WeeklySummaryResponse;
        setWeekly(data);
        await firebaseSaveSummary(userAuth, summaryId, data);
        firebaseGetAllSummaries(userAuth).then(setHistory);
      }
      loadedModes.current.add("weekly");
    } finally { setAiLoading(false); }
  }, [userAuth, weekDays, weekTotalPts, userStats, summaryId, promptConfig]);

  const generateDailyAi = useCallback(async (force = false) => {
    if (!userAuth) return;

    if (!force) {
      const cached = await firebaseGetDailySummary(userAuth, dailySummaryId);
      if (cached) {
        setDaily(cached);
        loadedModes.current.add("daily");
        return;
      }
    }

    setDailyAiLoading(true);
    try {
      const exercises = todayLogs.map(l => ({
        title: l.exceriseTitle || "Practice session",
        techniqueTime: l.timeSumary?.techniqueTime || 0,
        theoryTime: l.timeSumary?.theoryTime || 0,
        hearingTime: l.timeSumary?.hearingTime || 0,
        creativityTime: l.timeSumary?.creativityTime || 0,
        totalTime: l.timeSumary?.sumTime || 0,
        points: l.totalPoints || 0,
        songTitle: l.songTitle,
      }));

      const res = await fetch("/api/generate-daily-summary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercises,
          totalPoints: todayPts,
          streak: userStats?.actualDayWithoutBreak || 0,
          userLevel: userStats?.lvl || 1,
          practiceStyle: promptConfig.practiceStyle,
          goal: promptConfig.goal,
        }),
      });
      if (res.ok) {
        const data = await res.json() as DailySummaryResponse;
        setDaily(data);
        await firebaseSaveDailySummary(userAuth, dailySummaryId, data);
        firebaseGetAllDailySummaries(userAuth).then(setDailyHistory);
      }
      loadedModes.current.add("daily");
    } finally { setDailyAiLoading(false); }
  }, [userAuth, todayLogs, todayPts, userStats, dailySummaryId, promptConfig]);

  useEffect(() => {
    if (logsLoading || !userAuth || mode !== "weekly") return;
    if (lastWeekIdRef.current === summaryId) return;
    lastWeekIdRef.current = summaryId;
    setWeekly(null);
    generateAi();
  }, [logsLoading, mode, userAuth, summaryId, generateAi]);

  useEffect(() => {
    if (logsLoading || !userAuth || mode !== "daily") return;
    if (isSameDay(selectedDate, today)) return; // today's summary not available yet
    const dateStr = localDateStr(selectedDate);
    if (lastDailyDateRef.current === dateStr) return;
    lastDailyDateRef.current = dateStr;
    setDaily(null);
    generateDailyAi();
  }, [logsLoading, mode, userAuth, selectedDate, generateDailyAi, today]);

  const weekCfg = weekly ? WEEK_CFG[weekly.weekScore] : null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full flex-col">
      {/* ── Page header ───────────────────────────────────── */}
      <HeroBanner
        title="Practice Summary"
        subtitle={mode === "daily"
          ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
          : today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        eyebrow="Session"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(v => !v)}
              aria-label="AI Coach settings"
              aria-expanded={showConfig}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                showConfig
                  ? "bg-link/20 border-link/40 text-link"
                  : "bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10"
              )}
            >
              <Settings size={13} />
              AI Coach
            </button>
            <ModeToggle mode={mode} onChange={setMode}/>
          </div>
        }
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:gap-8 md:p-6 lg:p-8">

      {/* ── AI Coach config panel ──────────────────────────── */}
      {showConfig && (
        <div className="rounded-2xl border border-link/20 bg-zinc-900/80 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-200">AI Coach Settings</span>
            <button
              onClick={() => setShowConfig(false)}
              aria-label="Close AI Coach settings"
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Practice style */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Practice style</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPromptConfig(c => ({ ...c, practiceStyle: "hobby" }))}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all",
                  promptConfig.practiceStyle === "hobby"
                    ? "bg-link/15 border-link/40 text-link"
                    : "bg-zinc-800/40 border-white/5 text-zinc-500 hover:text-zinc-300"
                )}
              >
                Hobby
              </button>
              <button
                onClick={() => setPromptConfig(c => ({ ...c, practiceStyle: "professional" }))}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all",
                  promptConfig.practiceStyle === "professional"
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : "bg-zinc-800/40 border-white/5 text-zinc-500 hover:text-zinc-300"
                )}
              >
                Professional
              </button>
            </div>
            <p className="text-xs text-zinc-600">
              {promptConfig.practiceStyle === "professional"
                ? "Coach will be direct, technically precise, and hold you to a high standard."
                : "Coach will be warm, encouraging, and focused on fun and consistency."}
            </p>
          </div>

          {/* Goal */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your goal</span>
            <textarea
              value={promptConfig.goal}
              onChange={(e) => setPromptConfig(c => ({ ...c, goal: e.target.value.slice(0, GOAL_MAX_LENGTH) }))}
              placeholder="e.g. I want to learn fingerpicking and play folk songs"
              className="w-full bg-zinc-800/60 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 resize-none outline-none focus:border-link/40 transition-colors"
              rows={2}
            />
            <div className="flex justify-between">
              <p className="text-xs text-zinc-600">AI won&apos;t criticize areas outside your goal.</p>
              <span className="text-xs text-zinc-600 tabular-nums">{promptConfig.goal.length}/{GOAL_MAX_LENGTH}</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (userAuth) void firebaseSavePromptConfig(userAuth, promptConfig);
              setShowConfig(false);
              loadedModes.current.clear();
              if (mode === "weekly") { setWeekly(null); generateAi(true); }
              else { setDaily(null); generateDailyAi(true); }
            }}
            className="self-end px-5 py-2 rounded-xl text-sm font-bold bg-link/20 border border-link/30 text-link hover:bg-link/30 transition-colors"
          >
            Save &amp; regenerate
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          DAILY MODE
      ════════════════════════════════════════════════════ */}
      {mode === "daily" && (
        <div className="flex flex-col gap-6">

          {/* Activity strip */}
          <DayActivityStrip
            logs={logs}
            today={today}
            ratings={dailyRatings}
            selectedDate={selectedDate}
            onSelectDay={(d) => setSelectedDate(d)}
          />

          {/* Stats */}
          <StatStrip stats={[
            { icon:<Clock size={15}/>,  value:fmtMs(todayTotal),                              label:"Practice time" },
            { icon:<Zap size={15}/>,    value:`${todayPts}`,                                   label:"Points earned" },
            { icon:<Flame size={15}/>,  value:`${userStats?.actualDayWithoutBreak??0} days`,   label:"Streak" },
            { icon:<Star size={15}/>,   value:`Level ${userStats?.lvl??1}`,                    label:"Your level" },
          ]}/>

          {/* Today — summary not available yet */}
          {isSameDay(selectedDate, today) ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-link/10 ring-1 ring-link/20">
                <Sparkles className="h-6 w-6 text-link opacity-60" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-zinc-300">Today&apos;s summary isn&apos;t ready yet</p>
                <p className="text-xs text-zinc-500">Come back tomorrow — your coach will have a full assessment waiting for you.</p>
              </div>
              {todayTotal > 0 && (
                <p className="text-xs text-zinc-600">
                  {Math.round(todayTotal / 60000)} min practiced today — great work, keep going!
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Daily Assessment — merged rating + coach feedback */}
              {todayTotal > 0 ? (
                <div>
                  <SectionHeading icon={<Sparkles size={12}/>}>
                    {isSameDay(selectedDate, (() => { const d = new Date(); d.setDate(d.getDate()-1); return d; })())
                      ? "Yesterday's assessment"
                      : `${selectedDate.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} assessment`}
                  </SectionHeading>
                  <DailyAssessmentCard
                    key={`daily-${localDateStr(selectedDate)}`}
                    ratingId={`daily-${localDateStr(selectedDate)}`}
                    label={`${selectedDate.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})} practice`}
                    techniqueTime={todayTech / 1000}
                    theoryTime={todayTheory / 1000}
                    hearingTime={todayHear / 1000}
                    creativityTime={todayCreat / 1000}
                    totalTime={todayTotal / 1000}
                    points={todayPts}
                    streak={userStats?.actualDayWithoutBreak ?? 0}
                    userLevel={userStats?.lvl ?? 1}
                    daily={daily}
                    dailyLoading={dailyAiLoading}
                    onRatingReady={() => userAuth && firebaseGetAllDailyRatings(userAuth).then(setDailyRatings)}
                    practiceStyle={promptConfig.practiceStyle}
                    goal={promptConfig.goal}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-16 text-zinc-700">
                  <Guitar className="h-10 w-10 opacity-30"/>
                  <p className="text-sm font-medium text-zinc-500">No practice logged on this day</p>
                  <p className="text-xs text-zinc-600">Start a session to track your progress</p>
                </div>
              )}

              {/* Day timeline */}
              {todayLogs.length > 0 && (
                <div>
                  <SectionHeading icon={<ListMusic size={16}/>} count={todayLogs.length}>Sessions</SectionHeading>
                  <DayTimeline logs={todayLogs} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          WEEKLY MODE
      ════════════════════════════════════════════════════ */}
      {mode === "weekly" && (
        <div className="flex flex-col gap-6">

          {/* Week activity heatmap */}
          <ActivityHeatmap
            logs={logs}
            today={today}
            summaries={history}
            weekOffset={weekOffset}
            onSelectWeek={setWeekOffset}
          />

          {/* Points chart */}
          <PointsChart logs={logs} today={last7[6]} />

          {/* Stats row — full width */}
          <StatStrip stats={[
            { icon:<Clock size={15}/>,       value:fmtMinAsTime(weekTotalMin),                label:"Practice time",
              trend: mkTrend(weekTotalMin, prevWeekTotalMin, fmtMinAsTime) },
            { icon:<Zap size={15}/>,         value:`${weekTotalPts}`,                         label:"Points earned",
              trend: mkTrend(weekTotalPts, prevWeekTotalPts, n => `${n}`) },
            { icon:<CalendarDays size={15}/>,value:`${weekActive} / 7 days`,                  label:"Active days",
              trend: mkTrend(weekActive, prevWeekActive, n => `${n}d`) },
            { icon:<Flame size={15}/>,       value:`${userStats?.actualDayWithoutBreak??0}d`, label:"Streak" },
          ]}/>

          {/* Period rating */}
          {weekTotalMin > 0 && (
            <div>
              <SectionHeading icon={<Sparkles size={16}/>}>
                {weekOffset === 1 ? "Last week's rating" : `${last7[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} week rating`}
              </SectionHeading>
              <PeriodRatingCard
                compact
                ratingId={`weekly-${localDateStr(last7[0])}`}
                label="Last week's practice"
                techniqueTime={weekTech / 1000}
                theoryTime={weekTheory / 1000}
                hearingTime={weekHear / 1000}
                creativityTime={weekCreat / 1000}
                totalTime={weekTotalMin * 60}
                points={weekTotalPts}
                streak={userStats?.actualDayWithoutBreak ?? 0}
                userLevel={userStats?.lvl ?? 1}
                practiceStyle={promptConfig.practiceStyle}
                goal={promptConfig.goal}
              />
            </div>
          )}

          {/* AI weekly report */}
          <div>
            <SectionHeading icon={<Sparkles size={16}/>}>
              {weekOffset === 1 ? "Coach's weekly report" : `Coach's report — ${last7[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </SectionHeading>

            {aiLoading && (
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 flex flex-col gap-8">
                <AiSkeleton lines={2} />
                <div className="grid gap-8 sm:grid-cols-2">
                  <AiSkeleton lines={4}/>
                  <AiSkeleton lines={4}/>
                  <AiSkeleton lines={4}/>
                  <AiSkeleton lines={4}/>
                </div>
              </div>
            )}

            {!aiLoading && weekly && weekCfg && (
              <div className={cn("rounded-2xl border border-zinc-800/60 bg-zinc-900/50 border-l-[3px] overflow-hidden", weekCfg.accent)}>
                {/* header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-zinc-800/60 flex-wrap bg-zinc-900/40">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-medium">
                      {last7[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} – {last7[6].toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                    </span>
                  </div>
                  {weekly.bestDay && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                      <Star size={13}/> Best: {weekly.bestDay}
                    </span>
                  )}
                </div>

                {/* key insight */}
                {weekly.highlight && (
                  <div className="px-5 py-4 border-b border-zinc-800/60">
                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3">
                      <Lightbulb size={16} className="text-amber-400 mt-0.5 shrink-0"/>
                      <p className="text-sm font-medium text-zinc-200">{weekly.highlight}</p>
                    </div>
                  </div>
                )}

                {/* 4 sections in 2x2 grid */}
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <CoachSection icon={<Brain size={14}/>} label="Week overview" color="text-main">
                    {weekly.overview}
                  </CoachSection>
                  <CoachSection icon={<CheckCircle2 size={14}/>} label="What went well" color="text-emerald-400">
                    {weekly.strengths}
                  </CoachSection>
                  <CoachSection
                    icon={promptConfig.practiceStyle === "hobby" ? <Lightbulb size={14}/> : <TriangleAlert size={14}/>}
                    label={promptConfig.practiceStyle === "hobby" ? "Make it even better" : "Areas to improve"}
                    color={promptConfig.practiceStyle === "hobby" ? "text-emerald-400" : "text-yellow-400"}
                  >
                    {weekly.areasToImprove}
                  </CoachSection>
                  <CoachSection icon={<Target size={14}/>} label="Plan for this week" color="text-link">
                    {weekly.nextWeekPlan}
                  </CoachSection>
                </div>
              </div>
            )}

            {!aiLoading && !weekly && !logsLoading && (
              <div className="rounded-2xl border border-dashed border-zinc-800 py-10 text-center">
                <p className="text-sm text-zinc-600">No weekly report available</p>
              </div>
            )}
          </div>

          {weekActive === 0 && !logsLoading && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-16 text-zinc-700">
              <CalendarDays className="h-10 w-10 opacity-30"/>
              <p className="text-sm font-medium text-zinc-500">No practice last week</p>
              <p className="text-xs text-zinc-600">Start a session to build your streak</p>
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
};
