import { cn } from "assets/lib/utils";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import {
  BarChart2, Brain, Calendar, CalendarDays, CheckCircle2, Clock,
  Flame, Guitar, Headphones, Lightbulb, ListMusic, Music2,
  Sparkles, Star, Target, TrendingUp, TriangleAlert, Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { WeeklySummaryResponse } from "../types/summary.types";
import { PeriodRatingCard } from "../components/SessionRatingCard";

// ─── helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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

// ─── week config ──────────────────────────────────────────────────────────────

const WEEK_CFG = {
  excellent:    { label:"Exceptional week", chip:"bg-orange-500/10 text-orange-400 border-orange-500/25",   accent:"border-l-orange-500" },
  strong:       { label:"Strong week",      chip:"bg-emerald-500/10 text-emerald-400 border-emerald-500/25",accent:"border-l-emerald-500" },
  good:         { label:"Good progress",    chip:"bg-cyan-500/10 text-cyan-400 border-cyan-500/25",         accent:"border-l-cyan-500" },
  inconsistent: { label:"Inconsistent",     chip:"bg-yellow-500/10 text-yellow-400 border-yellow-500/25",   accent:"border-l-yellow-500" },
  minimal:      { label:"Minimal practice", chip:"bg-zinc-800 text-zinc-500 border-zinc-700",               accent:"border-l-zinc-700" },
} satisfies Record<WeeklySummaryResponse["weekScore"], { label:string; chip:string; accent:string }>;

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatStrip({ stats }: { stats: { icon: React.ReactNode; value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-2xl bg-zinc-900 border border-zinc-800/60 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            {s.icon}
            <span className="text-xs font-medium">{s.label}</span>
          </div>
          <p className="text-2xl font-semibold text-zinc-100 tabular-nums leading-none">{s.value}</p>
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
  "text-cyan-400":    { bar:"bg-cyan-500",    text:"text-cyan-400" },
  "text-violet-400":  { bar:"bg-violet-500",  text:"text-violet-400" },
  "text-emerald-400": { bar:"bg-emerald-500", text:"text-emerald-400" },
  "text-amber-400":   { bar:"bg-amber-500",   text:"text-amber-400" },
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

// ─── Session row ──────────────────────────────────────────────────────────────

function SessionRow({ log }: { log: FirebaseUserExceriseLog }) {
  const total   = log.timeSumary?.sumTime        || 0;
  const tech    = log.timeSumary?.techniqueTime  || 0;
  const theory  = log.timeSumary?.theoryTime     || 0;
  const hearing = log.timeSumary?.hearingTime    || 0;
  const creat   = log.timeSumary?.creativityTime || 0;

  const chips = [
    tech    && { label:"Tech",       val:tech,    cls:"text-cyan-400 bg-cyan-500/10" },
    theory  && { label:"Theory",     val:theory,  cls:"text-violet-400 bg-violet-500/10" },
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
          <p className="text-[11px] text-zinc-600 truncate mt-0.5">
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
  const VW = 600, VH = 90, PAD_T = 8, PAD_B = 20;

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
    <div>
      <SectionHeading icon={<TrendingUp size={16}/>}>
        Points — last week
      </SectionHeading>
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 px-5 pt-5 pb-4 relative">
        <div className="absolute top-4 right-5 text-sm font-medium text-zinc-400">
          <span className="text-amber-400 font-semibold">{totalPts} pts</span> · {activeDays} active day{activeDays !== 1 ? "s" : ""}
        </div>
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full overflow-visible" style={{ height: 90 }}>
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
            <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3" fill="#f59e0b" />
          ))}
          {data.map((d, idx) => (
            <text key={idx} x={pts[idx].x.toFixed(1)} y={VH} textAnchor="middle" fontSize="8" fill="#52525b">
              {d.day.toLocaleDateString("en-US", { weekday: "short" })}
            </text>
          ))}
        </svg>
      </div>
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
          className={cn("h-3 rounded-full overflow-hidden bg-zinc-800", i === lines-1 ? "w-2/3" : "w-full")}
        >
          <div
            className="h-full w-full"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.08) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: `shimmer 1.8s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
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
          {m === "daily" ? "Yesterday" : "Last Week"}
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
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800/80", color)}>
          {icon}
        </div>
        <p className="text-base font-medium text-zinc-200">{label}</p>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300 pl-[38px]">{children}</p>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export const SummaryView = () => {
  const [mode, setMode] = useState<Mode>("daily");
  const userAuth  = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);

  const [logs, setLogs]               = useState<FirebaseUserExceriseLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [weekly, setWeekly]           = useState<WeeklySummaryResponse | null>(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const loadedModes                   = useRef<Set<Mode>>(new Set());

  useEffect(() => {
    if (!userAuth) return;
    firebaseGetUserRaprotsLogs(userAuth, new Date().getFullYear())
      .then(setLogs).finally(() => setLogsLoading(false));
  }, [userAuth]);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // ── derived daily ──
  const todayLogs   = logs.filter(l => isSameDay(new Date(l.reportDate.seconds * 1000), yesterday));
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
    const daysToLastMonday = (currentDay === 0 ? 6 : currentDay - 1) + 7;
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

  // ── AI generation (weekly only) ──
  const generateAi = useCallback(async (force = false) => {
    if (!userAuth) return;

    const cacheKey = `cr-ai-weekly-${last7[0].toISOString().split("T")[0]}`;

    if (!force) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setWeekly(JSON.parse(cached));
          loadedModes.current.add("weekly");
          return;
        }
      } catch {}
    } else {
      try { sessionStorage.removeItem(cacheKey); } catch {}
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-weekly-summary", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          days: weekDays.map(d=>({
            dayName:d.dayName, date:d.date.toISOString().split("T")[0],
            exercises: d.logs.map(l=>({
              title:l.exceriseTitle||"Practice session", totalTime:l.timeSumary?.sumTime||0,
              techniqueTime:l.timeSumary?.techniqueTime||0, theoryTime:l.timeSumary?.theoryTime||0,
              hearingTime:l.timeSumary?.hearingTime||0,     creativityTime:l.timeSumary?.creativityTime||0,
              points:l.totalPoints||0, songTitle:l.songTitle,
            })),
            totalMinutes:d.totalMinutes, totalPoints:d.totalPoints,
          })),
          streak:userStats?.actualDayWithoutBreak||0, userLevel:userStats?.lvl||1, weekTotalPoints:weekTotalPts,
        }),
      });
      if (res.ok) {
        const data = await res.json() as WeeklySummaryResponse;
        setWeekly(data);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
      }
      loadedModes.current.add("weekly");
    } finally { setAiLoading(false); }
  }, [userAuth, weekDays, weekTotalPts, userStats]);

  useEffect(() => {
    if (logsLoading || !userAuth || mode !== "weekly") return;
    if (!loadedModes.current.has("weekly")) generateAi();
  }, [logsLoading, mode, generateAi, userAuth]);

  const weekCfg = weekly ? WEEK_CFG[weekly.weekScore] : null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:gap-8 md:p-8">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Sparkles className="h-5 w-5 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Practice Summary</h1>
          </div>
          <p className="pl-[48px] text-sm text-zinc-500">
            {yesterday.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
          </p>
        </div>
      </div>

      {/* ── Mode toggle ───────────────────────────────────── */}
      <ModeToggle mode={mode} onChange={setMode}/>

      {/* ════════════════════════════════════════════════════
          DAILY MODE
      ════════════════════════════════════════════════════ */}
      {mode === "daily" && (
        <div className="flex flex-col gap-6">

          {/* Stats */}
          <StatStrip stats={[
            { icon:<Clock size={15}/>,  value:fmtMs(todayTotal),                              label:"Practice time" },
            { icon:<Zap size={15}/>,    value:`${todayPts}`,                                   label:"Points earned" },
            { icon:<Flame size={15}/>,  value:`${userStats?.actualDayWithoutBreak??0} days`,   label:"Streak" },
            { icon:<Star size={15}/>,   value:`Level ${userStats?.lvl??1}`,                    label:"Your level" },
          ]}/>

          {/* Period rating */}
          {todayTotal > 0 && (
            <div>
              <SectionHeading icon={<Sparkles size={12}/>}>Yesterday's rating</SectionHeading>
              <PeriodRatingCard
                ratingId={`daily-${yesterday.toISOString().split("T")[0]}`}
                label="Yesterday's full practice"
                techniqueTime={todayTech / 1000}
                theoryTime={todayTheory / 1000}
                hearingTime={todayHear / 1000}
                creativityTime={todayCreat / 1000}
                totalTime={todayTotal / 1000}
                points={todayPts}
                streak={userStats?.actualDayWithoutBreak ?? 0}
                userLevel={userStats?.lvl ?? 1}
              />
            </div>
          )}

          {/* Time split */}
          {todayTotal > 0 && (
            <div>
              <SectionHeading icon={<BarChart2 size={16}/>}>Time split</SectionHeading>
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 px-5 py-5">
                <CategoryBars rows={[
                  { label:"Technique",  value:todayTech,   total:todayTotal, color:"text-cyan-400",    icon:<Zap size={12}/> },
                  { label:"Theory",     value:todayTheory, total:todayTotal, color:"text-violet-400",  icon:<Brain size={12}/> },
                  { label:"Ear Train.", value:todayHear,   total:todayTotal, color:"text-emerald-400", icon:<Headphones size={12}/> },
                  { label:"Creativity", value:todayCreat,  total:todayTotal, color:"text-amber-400",   icon:<Music2 size={12}/> },
                ]}/>
              </div>
            </div>
          )}

          {/* Sessions list */}
          {todayLogs.length > 0 && (
            <div>
              <SectionHeading icon={<ListMusic size={16}/>} count={todayLogs.length}>Sessions yesterday</SectionHeading>
              <div className="flex flex-col gap-2">
                {todayLogs.map((log, i) => <SessionRow key={i} log={log}/>)}
              </div>
            </div>
          )}

          {todayLogs.length === 0 && !logsLoading && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-16 text-zinc-700">
              <Guitar className="h-10 w-10 opacity-30"/>
              <p className="text-sm font-medium text-zinc-500">No practice logged yesterday</p>
              <p className="text-xs text-zinc-600">Start a session to track your progress</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          WEEKLY MODE
      ════════════════════════════════════════════════════ */}
      {mode === "weekly" && (
        <div className="flex flex-col gap-6">

          {/* Stats */}
          <StatStrip stats={[
            { icon:<Clock size={15}/>,       value:fmtMinAsTime(weekTotalMin),                label:"Last week" },
            { icon:<Zap size={15}/>,         value:`${weekTotalPts}`,                         label:"Points earned" },
            { icon:<CalendarDays size={15}/>,value:`${weekActive} / 7 days`,                  label:"Active days" },
            { icon:<Flame size={15}/>,       value:`${userStats?.actualDayWithoutBreak??0}d`, label:"Streak" },
          ]}/>

          {/* Period rating */}
          {weekTotalMin > 0 && (
            <div>
              <SectionHeading icon={<Sparkles size={16}/>}>Last week's rating</SectionHeading>
              <PeriodRatingCard
                compact
                ratingId={`weekly-${last7[0].toISOString().split("T")[0]}`}
                label="Last week's practice"
                techniqueTime={weekTech / 1000}
                theoryTime={weekTheory / 1000}
                hearingTime={weekHear / 1000}
                creativityTime={weekCreat / 1000}
                totalTime={weekTotalMin * 60}
                points={weekTotalPts}
                streak={userStats?.actualDayWithoutBreak ?? 0}
                userLevel={userStats?.lvl ?? 1}
              />
            </div>
          )}

          {/* Points — last week */}
          <PointsChart logs={logs} today={last7[6]} />

          {/* AI weekly report */}
          <div>
            <SectionHeading icon={<Sparkles size={16}/>}>Coach's weekly report</SectionHeading>

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
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm", weekCfg.chip)}>
                      <CalendarDays size={13}/>{weekCfg.label}
                    </span>
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
                  <div className="px-6 py-5 border-b border-zinc-800/60 bg-zinc-900/30">
                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3">
                      <Lightbulb size={16} className="text-amber-400 mt-0.5 shrink-0"/>
                      <p className="text-sm font-medium text-zinc-200">{weekly.highlight}</p>
                    </div>
                  </div>
                )}

                {/* 4 sections */}
                <div className="grid gap-8 px-6 py-6 sm:grid-cols-2 bg-gradient-to-b from-transparent to-black/10">
                  <CoachSection icon={<Brain size={14}/>} label="Week overview" color="text-cyan-400">
                    {weekly.overview}
                  </CoachSection>
                  <CoachSection icon={<CheckCircle2 size={14}/>} label="What went well" color="text-emerald-400">
                    {weekly.strengths}
                  </CoachSection>
                  <CoachSection icon={<TriangleAlert size={14}/>} label="Areas to improve" color="text-yellow-400">
                    {weekly.areasToImprove}
                  </CoachSection>
                  <CoachSection icon={<Target size={14}/>} label="Plan for this week" color="text-violet-400">
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

          {/* Time split */}
          {weekCatTotal > 0 && (
            <div>
              <SectionHeading icon={<BarChart2 size={16}/>}>Time split last week</SectionHeading>
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 px-5 py-5">
                <CategoryBars rows={[
                  { label:"Technique",  value:weekTech,   total:weekCatTotal, color:"text-cyan-400",    icon:<Zap size={12}/> },
                  { label:"Theory",     value:weekTheory, total:weekCatTotal, color:"text-violet-400",  icon:<Brain size={12}/> },
                  { label:"Ear Train.", value:weekHear,   total:weekCatTotal, color:"text-emerald-400", icon:<Headphones size={12}/> },
                  { label:"Creativity", value:weekCreat,  total:weekCatTotal, color:"text-amber-400",   icon:<Music2 size={12}/> },
                ]}/>
              </div>
            </div>
          )}

          {/* Sessions by day */}
          {weekActive > 0 && (
            <div>
              <SectionHeading icon={<ListMusic size={16}/>}>Sessions by day</SectionHeading>
              <div className="flex flex-col gap-5">
                {weekDays
                  .filter(d => d.logs.length > 0)
                  .map((d, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("text-sm font-semibold", "text-zinc-300")}>
                          {d.dayName}
                        </span>
                        <span className="text-[11px] text-zinc-600 tabular-nums">{fmtMinAsTime(d.totalMinutes)}</span>
                        <span className="text-[10px] text-amber-400/70 font-semibold tabular-nums">+{d.totalPoints} pts</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {d.logs.map((log,j) => <SessionRow key={j} log={log}/>)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

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
  );
};
