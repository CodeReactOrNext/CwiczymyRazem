// Pure, React-free milestone logic shared between the Milestones screen
// (SummaryView) and the sidebar "unclaimed reward" indicator. Keeping the level
// definitions and progress maths in one place means both surfaces agree on what
// counts as "met" / "claimable" — no drifting duplicate rules.

import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck, Flame, Guitar, Layers, Shield, Sprout, TrendingUp, Trophy, Zap,
} from "lucide-react";

export const MS_15 = 15 * 60 * 1000;
export const MS_20 = 20 * 60 * 1000;

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function currentWeekDates(today: Date): Date[] {
  const dow = today.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMon);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export interface DayStats {
  sumTime: number;
  tech: number;
  theory: number;
  hearing: number;
  creat: number;
}

export interface ProgressData {
  daysIn7With15: number;
  daysIn7With20: number;
  streak15: number;
  allCatsThisWeek: number;
  daysIn7AllCats: number;
  streakAllCats: number;
}

export const LEVEL_COLORS = [
  "#71717a", // 1  zinc
  "#a1a1aa", // 2  zinc-lighter
  "#fbbf24", // 3  amber
  "#f97316", // 4  orange
  "#06b6d4", // 5  cyan
  "#8b5cf6", // 6  violet
  "#ec4899", // 7  pink
  "#f59e0b", // 8  amber-deep
  "#eab308", // 9  gold (master)
];

export interface LevelDef {
  id: number;
  name: string;
  short?: string;    // compact label for the icon row (defaults to first word of name)
  req: string;
  Icon: LucideIcon;
  cost: number;      // 0 = free
  reward: number;    // fame per week claim
  isMet: (d: ProgressData) => boolean;
  getProgress: (d: ProgressData) => { value: number; max: number };
  dayGoalMin?: number;   // per-day minutes goal for week-bars/streak charts (default 15)
}

export const LEVELS: LevelDef[] = [
  {
    id: 1, name: "Spark",            Icon: Sprout,
    req: "1 day with 15+ min practice this week",
    cost: 0, reward: 20,
    isMet: d => d.daysIn7With15 >= 1,
    getProgress: d => ({ value: Math.min(d.daysIn7With15, 1), max: 1 }),
  },
  {
    id: 2, name: "Groove",           Icon: TrendingUp,
    req: "3 days with 20+ min this week",
    cost: 40, reward: 30,
    dayGoalMin: 20,
    isMet: d => d.daysIn7With20 >= 3,
    getProgress: d => ({ value: Math.min(d.daysIn7With20, 3), max: 3 }),
  },
  {
    id: 3, name: "Hot Streak",       Icon: Zap,
    req: "3-day streak with 15+ min each",
    cost: 80, reward: 45,
    isMet: d => d.streak15 >= 3,
    getProgress: d => ({ value: Math.min(d.streak15, 3), max: 3 }),
  },
  {
    id: 4, name: "Momentum",         Icon: CalendarCheck,
    req: "5 days with 15+ min this week",
    cost: 130, reward: 60,
    isMet: d => d.daysIn7With15 >= 5,
    getProgress: d => ({ value: Math.min(d.daysIn7With15, 5), max: 5 }),
  },
  {
    id: 5, name: "Unstoppable",      Icon: Flame,
    req: "7-day streak with 15+ min each",
    cost: 180, reward: 85,
    isMet: d => d.streak15 >= 7,
    getProgress: d => ({ value: Math.min(d.streak15, 7), max: 7 }),
  },
  {
    id: 6, name: "All-Rounder",      Icon: Layers,
    req: "3 days this week with all 4 categories at 15+ min",
    cost: 230, reward: 120,
    isMet: d => d.daysIn7AllCats >= 3,
    getProgress: d => ({ value: Math.min(d.daysIn7AllCats, 3), max: 3 }),
  },
  {
    id: 7, name: "In the Zone",      short: "Zone", Icon: Shield,
    req: "3-day streak with all 4 categories at 15+ min",
    cost: 280, reward: 160,
    isMet: d => d.streakAllCats >= 3,
    getProgress: d => ({ value: Math.min(d.streakAllCats, 3), max: 3 }),
  },
  {
    id: 8, name: "Shredder",         Icon: Guitar,
    req: "5-day streak with all 4 categories at 15+ min",
    cost: 300, reward: 220,
    isMet: d => d.streakAllCats >= 5,
    getProgress: d => ({ value: Math.min(d.streakAllCats, 5), max: 5 }),
  },
  {
    id: 9, name: "Virtuoso",         Icon: Trophy,
    req: "7-day streak with all 4 categories at 15+ min",
    cost: 300, reward: 300,
    isMet: d => d.streakAllCats >= 7,
    getProgress: d => ({ value: Math.min(d.streakAllCats, 7), max: 7 }),
  },
];

export function computeProgressData(logs: FirebaseUserExceriseLog[], today: Date): ProgressData {
  const byDate = new Map<string, DayStats>();

  for (const log of logs) {
    const key = localDateStr(new Date(log.reportDate.seconds * 1000));
    const ex  = byDate.get(key) ?? { sumTime: 0, tech: 0, theory: 0, hearing: 0, creat: 0 };
    byDate.set(key, {
      sumTime: ex.sumTime + (log.timeSumary?.sumTime        ?? 0),
      tech:    ex.tech    + (log.timeSumary?.techniqueTime  ?? 0),
      theory:  ex.theory  + (log.timeSumary?.theoryTime     ?? 0),
      hearing: ex.hearing + (log.timeSumary?.hearingTime    ?? 0),
      creat:   ex.creat   + (log.timeSumary?.creativityTime ?? 0),
    });
  }

  const has15 = (k: string) => (byDate.get(k)?.sumTime ?? 0) >= MS_15;
  const has20 = (k: string) => (byDate.get(k)?.sumTime ?? 0) >= MS_20;
  const hasAllCats = (k: string) => {
    const d = byDate.get(k);
    return !!d && d.tech >= MS_15 && d.theory >= MS_15 && d.hearing >= MS_15 && d.creat >= MS_15;
  };

  const weekDates = currentWeekDates(today);
  const weekStart = weekDates[0];                 // Monday 00:00 of the current week
  const thisWeek  = weekDates.map(d => localDateStr(d));

  const daysIn7With15  = thisWeek.filter(has15).length;
  const daysIn7With20  = thisWeek.filter(has20).length;
  const daysIn7AllCats = thisWeek.filter(hasAllCats).length;

  const allCatsThisWeek = (["tech", "theory", "hearing", "creat"] as const).filter(cat =>
    thisWeek.some(k => (byDate.get(k)?.[cat] ?? 0) > 0)
  ).length;

  // streak starting from today; if today not logged, start from yesterday.
  // Clamped to the current week — the streak resets every Monday, just like the
  // weekly claims, so last week's days never pre-complete this week's goal.
  const computeStreak = (pred: (k: string) => boolean): number => {
    let n = 0;
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    if (!pred(localDateStr(d))) d.setDate(d.getDate() - 1);
    for (;;) {
      if (d < weekStart) break;
      if (!pred(localDateStr(d))) break;
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  return {
    daysIn7With15,
    daysIn7With20,
    daysIn7AllCats,
    allCatsThisWeek,
    streak15:      computeStreak(has15),
    streakAllCats: computeStreak(hasAllCats),
  };
}
