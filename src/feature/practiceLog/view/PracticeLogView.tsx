import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { ActivityChart } from "components/Charts/ActivityChart";
import { EmptyState } from "components/EmptyState/EmptyState";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { NotebookPen } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";
import { convertMsToHM } from "utils/converter";

import { DayTimeline } from "../components/DayTimeline";
import { DeleteReportDialog } from "../components/DeleteReportDialog";
import { EditReportModal } from "../components/EditReportModal";
import { PracticeCalendar } from "../components/PracticeCalendar";
import { PracticeLogFilters } from "../components/PracticeLogFilters";
import { PracticeLogPagination } from "../components/PracticeLogPagination";
import { PracticeLogSummary } from "../components/PracticeLogSummary";
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
  summarize,
} from "../utils/practiceLog.utils";

const SESSIONS_PER_PAGE = 30;

export const PracticeLogView = () => {
  const { t } = useTranslation("practice_log");
  const userAuth = useAppSelector(selectUserAuth);
  const { sessions, isLoading, refresh } = usePracticeLogSessions(
    userAuth as string,
  );
  const { filters, setFilters, isFiltered } = usePracticeLogFilters();
  const selectedDay = getSelectedDay(filters);

  const [editingSession, setEditingSession] =
    useState<PracticeLogSession | null>(null);
  const [deletingSession, setDeletingSession] =
    useState<PracticeLogSession | null>(null);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Reset to the first page whenever the active filters change (render-time
  // state adjustment — the sanctioned alternative to a setState effect).
  const filterKey = `${filters.range}|${filters.from}|${filters.to}|${filters.type}|${filters.duration}|${filters.sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalPages = pages.length;
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visibleGroups = pages[currentPage - 1] ?? [];
  const currentYear = new Date().getFullYear();

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

  const handlePageChange = (next: number) => {
    setPage(next);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={cn("mx-auto flex w-full max-w-[1600px] flex-col gap-8", PAGE_CONTENT)}>
      <PracticeLogFilters
        filters={filters}
        setFilters={setFilters}
        isFiltered={isFiltered}
      />

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
        <EmptyState
          mood='wait'
          title={t("page.empty")}
          description={t("page.empty_hint")}
        />
      ) : (
        <div className='grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8'>
          <aside className='flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start'>
            <Card className='p-5 sm:p-6'>
              <PracticeCalendar
                days={allDayGroups}
                from={filters.from}
                to={filters.to}
                onSelect={(from, to) => setFilters({ from, to })}
              />
            </Card>
            {hasResults && (
              <Card className='p-5 sm:p-6'>
                <PracticeLogSummary summary={summary} />
              </Card>
            )}
          </aside>

          <div className='flex min-w-0 flex-col gap-6'>
            {!hasResults ? (
              <EmptyState
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
                {selectedDay ? (
                  <DayTimeline sessions={filteredSessions} />
                ) : (
                  summary.dailyRows.length >= 2 && (
                    <ActivityChart
                      data={summary.dailyRows}
                      showRangeSelect={false}
                      className='p-5 sm:p-6'
                    />
                  )
                )}

                <section ref={listRef} className='flex flex-col gap-4'>
                  <SectionHeader
                    title={t("page.sessions_heading")}
                    count={filteredSessions.length}
                    action={
                      totalPages > 1 && (
                        <p className='text-xs tabular-nums text-zinc-500'>
                          {t("pagination.page_of", {
                            page: currentPage,
                            total: totalPages,
                          })}
                        </p>
                      )
                    }
                    className='mb-0 items-baseline px-3'
                  />

                  <div className='flex flex-col gap-4'>
                    {visibleGroups.map((group) => (
                      <Card
                        key={group.dateKey}
                        className='p-2 sm:p-2.5'>
                        {/* Stacked below sm so the date keeps a full line to
                            itself instead of wrapping around the day totals. */}
                        <div className='flex flex-col gap-0.5 px-3 pb-1 pt-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3'>
                          <h3 className='font-display text-[15px] font-semibold text-zinc-100'>
                            {group.date.toLocaleDateString("en", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              ...(group.date.getFullYear() !== currentYear && {
                                year: "numeric",
                              }),
                            })}
                          </h3>
                          <p className='flex shrink-0 items-center gap-2.5 text-[11px] tabular-nums text-zinc-500'>
                            <span>
                              {t("page.day_sessions", {
                                count: group.sessions.length,
                              })}
                            </span>
                            <span>{convertMsToHM(group.totalTimeMs)}</span>
                            <span className='flex items-center gap-1'>
                              <img
                                src='/images/tokens/pick.png'
                                alt=''
                                aria-hidden
                                className='h-3 w-3 object-contain'
                              />
                              {group.totalPoints}
                            </span>
                          </p>
                        </div>
                        <div className='mt-1 flex flex-col'>
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
                  </div>

                  <PracticeLogPagination
                    page={currentPage}
                    totalPages={totalPages}
                    onChange={handlePageChange}
                  />
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
