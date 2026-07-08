import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import { animate, AnimatePresence, motion } from "framer-motion";
import AppLayout from "layouts/AppLayout/AppLayout";
import { ArrowRight, Award, Brain, Ear, Flame, Hand, Moon, Music, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ReferenceLine, ResponsiveContainer, XAxis,
} from "recharts";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

// ─────────────────────────────────────────────────────────────────────────────
// Session Summary — REDESIGN (styleguide-compliant, calm palette)
//
// docs/STYLEGUIDE.md: kolor = znaczenie. Baza zinc; dominanta cyan (gemy/level/
// XP/dane). Akcenty oszczędnie: amber=Fame, orange=streak, purple=rzadkie.
// Mock data — żywy ekran: layouts/RatingPopUpLayout/*.
// ─────────────────────────────────────────────────────────────────────────────

const MIN = 60 * 1000;
const DAILY_GOAL_MIN = 30; // linia celu na wykresie tygodnia

const CATS = [
  { key: "technique",  label: "Technika",    Icon: Hand  },
  { key: "theory",     label: "Teoria",      Icon: Brain },
  { key: "hearing",    label: "Słuch",       Icon: Ear   },
  { key: "creativity", label: "Kreatywność", Icon: Music },
] as const;

type CatKey = (typeof CATS)[number]["key"];

// ─── Mock data ────────────────────────────────────────────────────────────────
// Ustaw totalPoints: 0, żeby zobaczyć wariant "dzień odpoczynku" (#9).

const MOCK = {
  session: {
    title: "Alternate Picking — Speed Builder",
    song: { artist: "Metallica", title: "Master of Puppets" } as { artist: string; title: string } | null,
  },
  totalPoints: 420,
  fameEarned: 35,
  level: { from: 7, to: 8, prevPct: 62, currPct: 100 },
  skillGains: { technique: 12, theory: 6, hearing: 0, creativity: 8 } as Record<CatKey, number>,
  sessionMinutes: { technique: 30, theory: 15, hearing: 10, creativity: 20 } as Record<CatKey, number>,
  streak: { days: 12, bonusPct: 50 },
  unlockedAchievements: [{ title: "Speed Demon", desc: "10 sesji techniki z rzędu", rarity: "epic" }],
};

const ACTIVITY = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const f = i % 4 === 0 ? 0 : 1; // kilka dni odpoczynku
  const technique = f * (12 + (i % 5) * 4) * MIN;
  const theory = f * (8 + (i % 3) * 3) * MIN;
  const hearing = f * (5 + (i % 2) * 4) * MIN;
  const creativity = f * (6 + (i % 4) * 3) * MIN;
  const minutes = Math.round((technique + theory + hearing + creativity) / MIN);
  return {
    date: d,
    label: d.toLocaleDateString("pl-PL", { weekday: "short" }),
    minutes, technique, theory, hearing, creativity,
  };
});

const isLevelUp = MOCK.level.to > MOCK.level.from;
const isRest = MOCK.totalPoints === 0;

// ─── Animated count-up (respektuje prefers-reduced-motion) ────────────────────

function useCountUp(target: number, duration = 1.4) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [target, duration]);
  return value;
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg bg-zinc-900/40 p-7 md:p-8", className)}>{children}</div>;
}

function CardHeading({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {icon && <span className="text-zinc-400">{icon}</span>}
      <h3 className="text-sm font-semibold text-zinc-300">{children}</h3>
    </div>
  );
}

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`);

// ─── #8 Session header strip ──────────────────────────────────────────────────

function SessionHeader() {
  const s = MOCK.session;
  const dateLabel = new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
  const timeLabel = new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return (
    <Card className="flex items-center justify-between gap-4 py-5 md:py-5">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-zinc-100">{s.title}</p>
        {s.song && (
          <p className="truncate text-sm text-zinc-400">
            {s.song.artist} — {s.song.title}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right text-sm">
        <p className="text-zinc-300">{dateLabel}</p>
        <p className="text-zinc-500">{timeLabel}</p>
      </div>
    </Card>
  );
}

// ─── #9 Rest-day hero ─────────────────────────────────────────────────────────

function RestHero() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-zinc-900/60 px-7 py-16 text-center md:px-10">
      <HeroPattern className="opacity-[0.03]" maskImage="radial-gradient(ellipse at top, black 10%, transparent 70%)" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
          <Moon className="h-7 w-7" />
        </div>
        <p className="text-xl font-semibold text-zinc-100">Dzień odpoczynku</p>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
          Regeneracja też się liczy — Twój {MOCK.streak.days}-dniowy streak jest bezpieczny. Wróć jutro po kolejne punkty.
        </p>
        <Button className="mt-2 gap-2 bg-white font-semibold text-zinc-950 hover:bg-zinc-200">
          Wróć do pulpitu
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

// ─── Hero: points, Fame, skill gains, level bar, CTA ──────────────────────────

function HeroCard() {
  const points = useCountUp(MOCK.totalPoints);
  const fame = useCountUp(MOCK.fameEarned);
  const activeGains = CATS.filter((c) => MOCK.skillGains[c.key] > 0);

  return (
    <div className="relative overflow-hidden rounded-lg bg-zinc-900/60 px-7 py-12 text-center md:px-10 md:py-16">
      <HeroPattern className="opacity-[0.035]" maskImage="radial-gradient(ellipse at top, black 10%, transparent 70%)" />
      {/* #1 poświata pod liczbą punktów */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <div className="relative">
        <p className="text-sm font-medium text-zinc-400">Świetny progres!</p>

        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="font-teko text-8xl font-bold leading-none tabular-nums text-cyan-400">
            +{points}
          </span>
          <Image src="/images/points.png" alt="punkty" width={52} height={52} className="h-12 w-12 object-contain" />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded bg-amber-500/10 px-3 py-1 text-amber-400">
          <Image src="/images/coin.png" alt="Fame" width={18} height={18} className="h-4 w-4 object-contain" />
          <span className="text-sm font-bold tabular-nums">+{fame}</span>
          <span className="text-sm font-medium">Fame</span>
        </div>

        {activeGains.length > 0 && (
          <div className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-2.5">
            {activeGains.map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-2 rounded bg-zinc-800/50 px-3.5 py-2"
              >
                <c.Icon size={14} className="text-zinc-400" />
                <span className="text-sm text-zinc-300">{c.label}</span>
                <span className="text-sm font-bold tabular-nums text-cyan-400">+{MOCK.skillGains[c.key]}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* level progress (XP = cyan) */}
        <div className="mx-auto mt-10 max-w-md">
          <div className="mb-2.5 flex items-baseline justify-between text-sm">
            <span className="font-medium text-zinc-300">
              Poziom <span className="font-bold text-zinc-100">{MOCK.level.from}</span>
              <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-zinc-500" />
              <span className="font-bold text-cyan-400">{MOCK.level.to}</span>
            </span>
            {/* #4 badge Level Up! zamiast suchego 100% */}
            {isLevelUp ? (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 220, damping: 12 }}
                className="inline-flex items-center gap-1 rounded bg-cyan-500/15 px-2 py-0.5 text-xs font-bold text-cyan-300"
              >
                <Sparkles className="h-3 w-3" aria-hidden /> Level Up!
              </motion.span>
            ) : (
              <span className="font-bold tabular-nums text-cyan-400">{MOCK.level.currPct}%</span>
            )}
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-cyan-500"
              initial={{ width: `${MOCK.level.prevPct}%` }}
              animate={{ width: `${MOCK.level.currPct}%` }}
              transition={{ delay: 0.8, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            variant="ghost"
            className="w-full gap-2 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Powtórz sesję
          </Button>
          <Button className="w-full gap-2 bg-white font-semibold text-zinc-950 hover:bg-zinc-200 sm:w-auto">
            Kontynuuj
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── #7 Session time + breakdown (posortowane malejąco) ───────────────────────

function SessionTimeCard() {
  const totalMin = CATS.reduce((acc, c) => acc + MOCK.sessionMinutes[c.key], 0);
  const rows = [...CATS]
    .filter((c) => MOCK.sessionMinutes[c.key] > 0)
    .sort((a, b) => MOCK.sessionMinutes[b.key] - MOCK.sessionMinutes[a.key]);

  return (
    <Card className="h-full">
      <CardHeading>Czas sesji</CardHeading>
      <p className="font-teko text-6xl font-bold leading-none tabular-nums text-zinc-100">{fmtMin(totalMin)}</p>
      <p className="mt-2 text-xs font-medium text-emerald-400">+38% względem średniej</p>

      <div className="mt-8 space-y-5">
        {rows.map((c) => {
          const min = MOCK.sessionMinutes[c.key];
          const pct = totalMin > 0 ? (min / totalMin) * 100 : 0;
          return (
            <div key={c.key} className="flex items-center gap-3">
              <c.Icon size={15} className="shrink-0 text-zinc-400" />
              <div className="flex-1">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-300">{c.label}</span>
                  <span className="font-semibold tabular-nums text-zinc-400">{min}min</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-cyan-500/50" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── #6 Streak (dziś wyróżniony ringiem) ──────────────────────────────────────

function StreakCard() {
  const last7 = ACTIVITY.slice(-7);
  return (
    <Card className="h-full">
      <CardHeading icon={<Flame className="h-4 w-4 text-orange-500" />}>Streak</CardHeading>

      <div className="flex items-baseline gap-2">
        <span className="font-teko text-6xl font-bold leading-none tabular-nums text-zinc-100">{MOCK.streak.days}</span>
        <span className="text-sm font-medium text-zinc-400">dni z rzędu</span>
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-orange-500/10 px-2.5 py-1">
        <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden />
        <span className="text-xs font-bold text-orange-400">+{MOCK.streak.bonusPct}% punktów</span>
      </div>

      <div className="mt-8 flex justify-between gap-2">
        {last7.map((d, i) => {
          const active = d.minutes > 0;
          const isToday = i === last7.length - 1;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-11 w-full items-center justify-center rounded",
                  active ? "bg-orange-500/15" : "bg-zinc-800",
                  isToday && "ring-1 ring-orange-400/70"
                )}
              >
                {active && <Flame className="h-4 w-4 text-orange-400/80" aria-hidden />}
              </div>
              <span className={cn("text-[10px] font-medium", isToday ? "text-zinc-300" : "text-zinc-500")}>
                {isToday ? "dziś" : d.label.slice(0, 1)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── #5 Weekly insight (dziś podświetlony + linia celu) ───────────────────────

function WeeklyInsightCard() {
  const data = ACTIVITY.slice(-7);
  const totalMin = data.reduce((acc, d) => acc + d.minutes, 0);

  const renderDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props;
    if (cx == null || cy == null) return <g key={`dot-${index}`} />;
    const isToday = index === data.length - 1;
    if (!isToday) return <g key={`dot-${index}`} />;
    return (
      <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill="#22d3ee" stroke="#09090b" strokeWidth={2} />
    );
  };

  return (
    <Card className="h-full">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Ten tydzień</h3>
        <span className="font-teko text-3xl font-bold leading-none tabular-nums text-zinc-100">{fmtMin(totalMin)}</span>
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
            <ReferenceLine
              y={DAILY_GOAL_MIN}
              stroke="#3f3f46"
              strokeDasharray="4 4"
              label={{ value: "cel", position: "right", fontSize: 9, fill: "#52525b" }}
            />
            <Area
              dataKey="minutes"
              type="monotone"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#weekGrad)"
              dot={renderDot}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── #3 Skill balance radar — ostatnie 7 dni vs poprzednie 7 dni ──────────────

function SkillBalanceCard() {
  const { data, rows } = useMemo(() => {
    const last7 = ACTIVITY.slice(-7);
    const prev7 = ACTIVITY.slice(0, 7);
    const sum = (arr: typeof ACTIVITY, key: CatKey) => arr.reduce((a, d) => a + d[key], 0);

    const cur: Record<CatKey, number> = { technique: 0, theory: 0, hearing: 0, creativity: 0 };
    const prv: Record<CatKey, number> = { technique: 0, theory: 0, hearing: 0, creativity: 0 };
    for (const c of CATS) {
      cur[c.key] = sum(last7, c.key);
      prv[c.key] = sum(prev7, c.key);
    }

    const data = CATS.map((c) => {
      const max = Math.max(cur[c.key], prv[c.key], 1);
      return {
        cat: c.label,
        prev: Math.round((prv[c.key] / max) * 100),
        current: Math.round((cur[c.key] / max) * 100),
      };
    });

    const rows = CATS.map((c) => ({
      ...c,
      curMin: Math.round(cur[c.key] / MIN),
      deltaMin: Math.round((cur[c.key] - prv[c.key]) / MIN),
    }));

    return { data, rows };
  }, []);

  return (
    <Card className="h-full">
      <div className="mb-6 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-300">Balans umiejętności</h3>
        <span className="text-xs text-zinc-500">· ostatnie 7 dni</span>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="80%">
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Radar dataKey="prev" stroke="#52525b" fill="#52525b" fillOpacity={0.12} />
            <Radar dataKey="current" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex justify-center gap-5">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400" /> Ten tydzień
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-zinc-600" /> Poprzedni
        </span>
      </div>

      {/* wartości per kategoria: ten tydzień (+/- vs poprzedni) */}
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map((c) => (
          <div key={c.key} className="flex items-center gap-2.5">
            <c.Icon size={14} className="shrink-0 text-zinc-400" />
            <span className="flex-1 text-xs text-zinc-300">{c.label}</span>
            <span className="text-xs font-semibold tabular-nums text-zinc-200">{fmtMin(c.curMin)}</span>
            {c.deltaMin !== 0 && (
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums",
                  c.deltaMin > 0 ? "text-emerald-400" : "text-zinc-500"
                )}
              >
                {c.deltaMin > 0 ? "+" : ""}{c.deltaMin}min
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Achievements ─────────────────────────────────────────────────────────────

const RARITY_COLOR: Record<string, string> = {
  common: "#ffffff",
  rare: "#b1f9ff",
  veryRare: "#ffe54c",
  epic: "#a855f7",
};

function AchievementsCard() {
  const items = MOCK.unlockedAchievements;
  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <Card>
            <CardHeading icon={<Award className="h-4 w-4 text-purple-400" />}>Nowe osiągnięcia</CardHeading>
            <div className="space-y-3">
              {items.map((a) => {
                const color = RARITY_COLOR[a.rarity] ?? "#ffffff";
                return (
                  <div key={a.title} className="flex items-center gap-4 rounded bg-zinc-800/40 px-4 py-3.5">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}1a`, color }}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-100">{a.title}</p>
                      <p className="text-xs text-zinc-400">{a.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SessionSummaryPage: NextPageWithLayout = () => {
  return (
    <div className="min-h-screen bg-zinc-950 lg:mt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8"
      >
        <SessionHeader />

        {isRest ? <RestHero /> : <HeroCard />}

        {!isRest && (
          <>
            {/* #2 wyrównane wysokości kart w rzędzie */}
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
              <SessionTimeCard />
              <StreakCard />
            </div>

            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
              <WeeklyInsightCard />
              <SkillBalanceCard />
            </div>

            <AchievementsCard />
          </>
        )}
      </motion.div>
    </div>
  );
};

SessionSummaryPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="summary" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default SessionSummaryPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "profile", "footer", "achievements", "toast", "skills", "songs", "chat", "my_plans", "exercises"],
});
