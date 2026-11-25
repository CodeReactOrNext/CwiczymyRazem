import { Button, buttonVariants } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { differenceInCalendarDays } from "date-fns";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { NotebookPen, Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import { convertMsToHM } from "utils/converter";
import { getReconciledStreak, hasRestDays } from "utils/gameLogic";

import { DayTimeline } from "../components/DayTimeline";
import { DeleteReportDialog } from "../components/DeleteReportDialog";
import { EditReportModal } from "../components/EditReportModal";
import { PracticeBars } from "../components/PracticeBars";
import { PracticeCalendar } from "../components/PracticeCalendar";
import { PracticeLogFilters } from "../components/PracticeLogFilters";
import {
  PracticeLogRestTiles,
  PracticeLogTiles,
  PracticeLogTimeSplit,
  PracticeLogTopTiles,
} from "../components/PracticeLogSummary";
import { SessionCard } from "../components/SessionCard";
import { usePracticeLogFilters } from "../hooks/usePracticeLogFilters";
import { usePracticeLogSessions } from "../hooks/usePracticeLogSessions";
import type { PracticeLogSession } from "../types/practiceLog.types";
import {
  applyFilters,
  applySort,
  getSelectedDay,
  groupSessionsByDay,
  paginateDayGroups,
  parseDateKey,
  summarize,
} from "../utils/practiceLog.utils";
import { getNextStreakMilestone } from "../utils/practiceRuns";

const SESSIONS_PER_PAGE = 30;

/** "Today" / "Yesterday" in the app's language, else the date. */
const formatDay = (date: Date, locale: string) => {
  const now = new Date();
  const daysAgo = differenceInCalendarDays(now, date);
  if (daysAgo === 0 || daysAgo === 1) {
    const label = new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
    }).format(-daysAgo, "day");
    return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
  }
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
};

/** Outlines of the rows to come, under the empty state. */
const GhostRows = () => (
  <div
    className='mt-3 flex flex-col gap-5 rounded-lg bg-zinc-800/20 p-5'
    aria-hidden>
    {["w-56", "w-40", "w-64"].map((width) => (
      <div key={width} className='flex items-center gap-3.5'>
        <span className='h-11 w-11 shrink-0 rounded-lg bg-zinc-800/60' />
        <span className={cn("h-3 max-w-[50%] rounded bg-zinc-800/60", width)} />
        <span className='ml-auto h-3 w-14 rounded bg-zinc-800/60' />
      </div>
    ))}
  </div>
);

export const PracticeLogView = () => {
  const { t } = useTranslation("practice_log");
  const locale = useIntlLocale() ?? "en";
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const { sessions, isLoading, refresh } = usePracticeLogSessions(
    userAuth as string,
  );
  const { filters, setFilters, isFiltered } = usePracticeLogFilters();
  const selectedDay = getSelectedDay(filters);

  const [editingSession, setEditingSession] =
    useState<PracticeLogSession | null>(null);
  const [deletingSession, setDeletingSession] =
    useState<PracticeLogSession | null>(null);
  const [shownPages, setShownPages] = useState(1);

  const filteredSessions = useMemo(
    () => applySort(applyFilters(sessions ?? [], filters), filters.sort),
    [sessions, filters],
  );

  const summary = useMemo(
    () => summarize(filteredSessions),
    [filteredSessions],
  );

  const dayGroups = useMemo(
    () => groupSessionsByDay(filteredSessions),
    [filteredSessions],
  );

  const pages = useMemo(
    () => paginateDayGroups(dayGroups, SESSIONS_PER_PAGE),
    [dayGroups],
  );

  /** Every day with practice (ignores filters) — feeds the calendar. */
  const allDayGroups = useMemo(
    () => groupSessionsByDay(sessions ?? []),
    [sessions],
  );

  const milestone = useMemo(() => {
    const { dayWithoutBreak, didPracticeToday } = getReconciledStreak({
      actualDayWithoutBreak: userStats?.actualDayWithoutBreak ?? 0,
      lastReportDate: userStats?.lastReportDate ?? "",
      reportDates: (sessions ?? []).map((session) => session.date),
      restDays: hasRestDays(userStats),
    });
    return getNextStreakMilestone(dayWithoutBreak, didPracticeToday);
  }, [sessions, userStats]);

  // Back to the first stretch whenever the active filters change (render-time
  // state adjustment — the sanctioned alternative to a setState effect).
  const filterKey = `${filters.range}|${filters.from}|${filters.to}|${filters.type}|${filters.duration}|${filters.sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setShownPages(1);
  }

  const visibleGroups = pages.slice(0, shownPages).flat();
  const hasMore = pages.length > shownPages;
  const rangeEnd = useMemo(
    () => (filters.to ? parseDateKey(filters.to) : undefined),
    [filters.to],
  );

  const hasAnySessions = (sessions?.length ?? 0) > 0;
  const hasResults = filteredSessions.length > 0;

  // When a single day is selected, number sessions by time so the cards line up
  // with the day-timeline markers regardless of the active sort order.
  const timelineIndex = useMemo(() => {
    if (!selectedDay) return null;
    const map = new Map<string, number>();
    [...filteredSessions]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach((session, i) => map.set(session.id, i + 1));
    return map;
  }, [selectedDay, filteredSessions]);

  return (
    <div className={cn("mx-auto flex w-full max-w-[1600px] flex-col gap-8", PAGE_CONTENT)}>
      {/* Nothing to filter until the first session is in. */}
      {(sessions === null || hasAnySessions) && (
        <PracticeLogFilters
          filters={filters}
          setFilters={setFilters}
          isFiltered={isFiltered}
        />
      )}

      {isLoading || sessions === null ? (
        <div className='grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8'>
          <Skeleton variant='block' className='h-80' />
          <div className='flex flex-col gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant='block' className='h-36' />
            ))}
          </div>
        </div>
      ) : !hasAnySessions ? (
        // No sessions yet: Kostek drums its fingers, waiting for the first one.
        <div>
          <EmptyState
            mood='wait'
            title={t("page.empty")}
            action={
              <>
                <Link href='/timer' className={buttonVariants()}>
                  <Play />
                  {t("page.start")}
                </Link>
                <Link
                  href='/report'
                  className={buttonVariants({ variant: "ghost" })}>
                  {t("hero.add")}
                </Link>
              </>
            }
          />
          <GhostRows />
        </div>
      ) : (
        // Below lg both columns dissolve into one, and `order` puts the list
        // right after the calendar — the charts wait under it.
        <div className='flex flex-col gap-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8'>
          <aside className='contents lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-4 lg:self-start'>
            {hasResults && (
              <PracticeLogTopTiles
                summary={summary}
                className='order-1 lg:hidden'
              />
            )}
            <Card className='order-2 p-5 lg:order-none'>
              <PracticeCalendar
                days={allDayGroups}
                from={filters.from}
                to={filters.to}
                onSelect={(from, to) => setFilters({ from, to })}
                milestone={milestone}
              />
            </Card>
            {hasResults && (
              <>
                <PracticeLogTiles summary={summary} className='hidden lg:grid' />
                <PracticeLogRestTiles
                  summary={summary}
                  className='order-5 lg:hidden'
                />
                <PracticeLogTimeSplit
                  summary={summary}
                  className='order-6 lg:order-none'
                />
              </>
            )}
          </aside>

          <div className='contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6'>
            {!hasResults ? (
              <EmptyState
                className='order-3 lg:order-none'
                icon={<NotebookPen />}
                title={t("page.empty_filtered")}
                description={t("page.empty_filtered_hint")}
                action={
                  <Button
                    variant='ghost'
                    onClick={() =>
                      setFilters({ range: "all", type: "all", duration: "all" })
                    }>
                    {t("filters.clear_all")}
                  </Button>
                }
              />
            ) : (
              <>
                <div
                  className={cn(
                    "lg:order-none",
                    // The day's timeline belongs to the day just picked; the
                    // overview chart can wait below the list.
                    selectedDay ? "order-2" : "order-4",
                  )}>
                  {selectedDay ? (
                    <DayTimeline sessions={filteredSessions} />
                  ) : (
                    <PracticeBars
                      days={dayGroups}
                      totalMs={summary.totalTimeMs}
                      end={rangeEnd}
                    />
                  )}
                </div>

                <section className='order-3 flex min-w-0 flex-col gap-4 lg:order-none'>
                  <SectionHeader
                    title={t("page.sessions_heading")}
                    count={filteredSessions.length}
                    size='lg'
                    className='mb-0'
                  />

                  {visibleGroups.map((group) => (
                    <Card key={group.dateKey} className='p-2'>
                      <div className='flex items-baseline justify-between gap-3 px-2 pb-1 pt-2 sm:px-3'>
                        <h3 className='font-display text-[15px] font-semibold text-zinc-100'>
                          {formatDay(group.date, locale)}
                        </h3>
                        <p className='shrink-0 text-[13px] tabular-nums text-zinc-400'>
                          {convertMsToHM(group.totalTimeMs)}
                        </p>
                      </div>
                      <div className='flex flex-col'>
                        {group.sessions.map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            onEdit={setEditingSession}
                            onDelete={setDeletingSession}
                            index={timelineIndex?.get(session.id)}
                          />
                        ))}
                      </div>
                    </Card>
                  ))}

                  {hasMore && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='touch'
                      className='w-full'
                      onClick={() => setShownPages((shown) => shown + 1)}>
                      {t("pagination.show_more")}
                    </Button>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      )}

      <EditReportModal
        session={editingSession}
        onOpenChange={(open) => !open && setEditingSession(null)}
        onSaved={refresh}
      />
      <DeleteReportDialog
        session={deletingSession}
        onOpenChange={(open) => !open && setDeletingSession(null)}
        onDeleted={refresh}
      />
    </div>
  );
};
