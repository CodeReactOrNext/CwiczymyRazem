import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_TABS } from "constants/navTabs";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { selectUserAuth } from "feature/user/store/userSlice";
import {
  CalendarDays as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { useCalendar } from "../hooks/useCalendar";
import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import { usePlannerSources } from "../hooks/usePlannerSources";
import type { PracticeArea } from "../types/calendar.types";
import {
  addDays,
  startOfWeek,
  toDateKey,
  weekDates,
} from "../utils/calendarDates";
import { buildDayPlan, isItemDone } from "../utils/calendarItems";
import { AddItemDialog } from "./AddItemDialog";
import type { DayEntry } from "./DayColumn";
import { DayColumn } from "./DayColumn";
import { DayStrip } from "./DayStrip";
import { WeekOverview } from "./WeekOverview";

const DATE_KEY = /^d{4}-d{2}-d{2}$/;

const EXERCISES_BY_ID = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);

interface ActiveSession {
  date: string;
  plan: ExercisePlan;
  itemIds: string[];
}

/**
 * The practice calendar: a week of days, each holding what to play and for
 * how long, and an auto-planner that lays out the coming days from the
 * player's songs, goals and roadmaps at their level. A day plays in place as
 * one session (like Rotation) and comes back here after the report.
 */
export const CalendarView = () => {
  const router = useRouter();
  const uid = useAppSelector(selectUserAuth);
  const { formatDate, t } = useCalendarDisplay();
  const calendar = useCalendar(uid);
  const sources = usePlannerSources(uid);

  const [today] = useState(() => toDateKey(new Date()));
  // `?week=` comes back from the auto-planner, on the first day it filled.
  const [weekAnchor, setWeekAnchor] = useState(() => {
    const week = router.query.week;
    return typeof week === "string" && DATE_KEY.test(week) ? week : today;
  });
  const [dialog, setDialog] = useState<{ date: string } | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    posthog.capture("calendar_viewed");
  }, []);

  const dates = useMemo(() => weekDates(weekAnchor), [weekAnchor]);
  const currentMonday = startOfWeek(today);
  const shownMonday = dates[0];

  const week = useMemo(() => {
    const byDate: Record<string, DayEntry[]> = {};
    const minutesByArea: Record<PracticeArea, number> = {
      technique: 0,
      songs: 0,
      theory: 0,
      hearing: 0,
      creativity: 0,
    };
    let planned = 0;
    let played = 0;
    let activeDays = 0;
    dates.forEach((date) => {
      const entries = (calendar.days[date] ?? []).map((item) => ({
        item,
        done: isItemDone(item, date, sources.practicedStamps),
      }));
      byDate[date] = entries;
      if (entries.length > 0) activeDays += 1;
      entries.forEach(({ item, done }) => {
        planned += item.minutes;
        minutesByArea[item.area] += item.minutes;
        if (done) played += item.minutes;
      });
    });
    return { byDate, minutesByArea, planned, played, activeDays };
  }, [dates, calendar.days, sources.practicedStamps]);

  // The day open on a phone: the picked one while it is in the shown week,
  // else today, else the week's first day with something on it.
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const selectedDate =
    pickedDate && dates.includes(pickedDate)
      ? pickedDate
      : dates.includes(today)
        ? today
        : (dates.find((date) => (calendar.days[date] ?? []).length > 0) ??
          dates[0]);

  const rangeLabel = `${formatDate(dates[0], { day: "numeric", month: "short" })} – ${formatDate(dates[6], { day: "numeric", month: "short", year: "numeric" })}`;
  const weekLabel =
    shownMonday === currentMonday
      ? t("week.this_week")
      : shownMonday === addDays(currentMonday, 7)
        ? t("week.next_week")
        : shownMonday === addDays(currentMonday, -7)
          ? t("week.last_week")
          : null;

  const planHref =
    shownMonday > currentMonday
      ? "/calendar/plan?range=next_week"
      : "/calendar/plan";

  const fail = () => toast.error(t("toast.error"));

  const playDay = (date: string) => {
    const open = week.byDate[date]
      .filter((entry) => !entry.done)
      .map((entry) => entry.item);
    const plan = buildDayPlan(date, open, EXERCISES_BY_ID);
    if (!plan) {
      toast.error(t("toast.nothing_to_play"));
      return;
    }
    posthog.capture("calendar_day_started", {
      items: open.length,
      is_today: date === today,
    });
    setSession({ date, plan, itemIds: open.map((item) => item.id) });
  };

  const clearWeek = async () => {
    const before = Object.fromEntries(
      dates.map((date) => [date, calendar.days[date] ?? []]),
    );
    try {
      await calendar.clearDays(dates, false);
      toast(t("toast.cleared"), {
        action: {
          label: t("toast.undo"),
          onClick: () => void calendar.setDays(before),
        },
      });
    } catch {
      fail();
    }
  };

  const removeItem = async (date: string, itemId: string) => {
    const before = calendar.days[date] ?? [];
    try {
      await calendar.removeItem(date, itemId);
      toast(t("toast.removed"), {
        action: {
          label: t("toast.undo"),
          onClick: () => void calendar.setDays({ [date]: before }),
        },
      });
    } catch {
      fail();
    }
  };

  if (session) {
    return (
      <MainContainer>
        <PracticeSession
          plan={session.plan}
          onClose={() => setSession(null)}
          onFinish={() => {
            setIsFinishing(true);
            void calendar
              .markDone(session.date, session.itemIds)
              .catch(() => undefined);
            router.push("/report?returnTo=/calendar");
          }}
          isFinishing={isFinishing}
        />
      </MainContainer>
    );
  }

  const renderDay = (date: string) => (
    <DayColumn
      key={date}
      date={date}
      entries={week.byDate[date]}
      isToday={date === today}
      isPast={date < today}
      weekDates={dates}
      onAdd={() => setDialog({ date })}
      onPlay={() => playDay(date)}
      onToggleDone={(itemId) =>
        void calendar.toggleDone(date, itemId).catch(fail)
      }
      onMove={(itemId, to) =>
        void calendar.moveItem(date, to, itemId).catch(fail)
      }
      onRemove={(itemId) => void removeItem(date, itemId)}
    />
  );

  const weekIsEmpty = !calendar.isLoading && week.planned === 0;

  return (
    <div className='flex min-h-screen flex-col overflow-visible rounded-lg bg-second-600'>
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        eyebrow={t("page.eyebrow")}
        eyebrowClassName='text-cyan-400/80'
        backgroundContent={<HeroPattern />}
        className='mb-6 min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
      />

      <div className='px-3 md:px-6 lg:px-8'>
        <PageTabs
          tabs={LIBRARY_TABS}
          activeHref='/calendar'
          ariaLabel='Library sections'
        />
      </div>

      <div className='space-y-8 px-3 py-6 md:px-6 md:py-8 lg:px-8'>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1 rounded-lg bg-zinc-900/60 p-1'>
              <button
                type='button'
                onClick={() => setWeekAnchor(addDays(shownMonday, -7))}
                aria-label={t("week.previous")}
                className='flex h-9 w-9 items-center justify-center rounded text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800'>
                <ChevronLeft className='h-4 w-4' />
              </button>
              <button
                type='button'
                onClick={() => setWeekAnchor(today)}
                disabled={shownMonday === currentMonday}
                className='h-9 rounded px-3 text-sm font-medium text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:text-zinc-500 hover:bg-zinc-800 disabled:hover:bg-transparent'>
                {t("week.today")}
              </button>
              <button
                type='button'
                onClick={() => setWeekAnchor(addDays(shownMonday, 7))}
                aria-label={t("week.next")}
                className='flex h-9 w-9 items-center justify-center rounded text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800'>
                <ChevronRight className='h-4 w-4' />
              </button>
            </div>
            <div>
              <h2 className='text-base font-semibold text-zinc-100'>
                {rangeLabel}
              </h2>
              {weekLabel && (
                <p className='mt-0.5 text-xs text-zinc-400'>{weekLabel}</p>
              )}
            </div>
          </div>

          <div className='flex gap-2'>
            {week.planned > 0 && (
              <Button
                onClick={clearWeek}
                aria-label={t("week.clear")}
                className='h-10 w-10 shrink-0 rounded-lg border-b-black/40 bg-zinc-800 p-0 text-zinc-300 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
                <Eraser className='h-4 w-4' />
              </Button>
            )}
            <Button
              onClick={() => setDialog({ date: selectedDate })}
              className='h-10 flex-1 rounded-lg border-b-black/40 bg-zinc-800 px-4 text-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700 sm:flex-none'>
              <Plus className='h-4 w-4' />
              {t("actions.add")}
            </Button>
            <Button
              asChild
              className='h-10 flex-1 rounded-lg border-b-black/25 bg-white px-5 font-bold text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200 sm:flex-none'>
              <Link href={planHref}>
                <Sparkles className='h-4 w-4' />
                {t("actions.autoplan")}
              </Link>
            </Button>
          </div>
        </div>

        {calendar.isLoading ? (
          <div
            className='h-[120px] animate-pulse rounded-lg bg-zinc-900/40'
            aria-busy
          />
        ) : weekIsEmpty ? (
          <section className='flex flex-col items-start gap-6 rounded-lg bg-zinc-900/40 p-6 sm:flex-row sm:items-center sm:p-8'>
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400'>
              <CalendarIcon className='h-5 w-5' aria-hidden />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-base font-semibold text-zinc-100'>
                {t("empty.title")}
              </p>
              <p className='mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-400'>
                {t("empty.body")}
              </p>
            </div>
            <Button
              asChild
              className='h-11 rounded-lg border-b-black/25 bg-white px-6 font-bold text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
              <Link href={planHref}>
                <Sparkles className='h-4 w-4' />
                {t("empty.cta")}
              </Link>
            </Button>
          </section>
        ) : (
          <WeekOverview
            planned={week.planned}
            played={week.played}
            activeDays={week.activeDays}
            minutesByArea={week.minutesByArea}
          />
        )}

        {calendar.isLoading ? (
          <div className='grid gap-3 lg:grid-cols-7'>
            {dates.map((date) => (
              <div
                key={date}
                className={cn(
                  "h-40 animate-pulse rounded-lg bg-zinc-900/40 lg:h-[22rem]",
                  date !== dates[0] && "hidden lg:block",
                )}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Phone: a strip of days and the picked one under it. */}
            <div className='space-y-3 lg:hidden'>
              <DayStrip
                dates={dates}
                byDate={week.byDate}
                selected={selectedDate}
                today={today}
                onSelect={setPickedDate}
              />
              {renderDay(selectedDate)}
            </div>
            <div className='hidden gap-3 lg:grid lg:grid-cols-7'>
              {dates.map(renderDay)}
            </div>
          </>
        )}
      </div>

      {dialog && (
        <AddItemDialog
          dateLabel={formatDate(dialog.date, {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
          sources={sources}
          onAdd={(item) => calendar.addItem(dialog.date, item)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
};
