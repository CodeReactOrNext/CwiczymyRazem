import { ActivityChart } from "components/Charts/ActivityChart";
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
  groupSessionsByDay,
  paginateDayGroups,
  summarize,
} from "../utils/practiceLog.utils";

const SESSIONS_PER_PAGE = 30;

export const PracticeLogView = () => {
  const { t } = useTranslation("practice_log");
  const userAuth = useAppSelector(selectUserAuth);
  const { sessions, isLoading, refresh } = usePracticeLogSessions(
    userAuth as string
  );
  const { filters, setFilters, isFiltered } = usePracticeLogFilters();

  const [editingSession, setEditingSession] =
    useState<PracticeLogSession | null>(null);
  const [deletingSession, setDeletingSession] =
    useState<PracticeLogSession | null>(null);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredSessions = useMemo(
    () => applySort(applyFilters(sessions ?? [], filters), filters.sort),
    [sessions, filters]
  );

  const summary = useMemo(() => summarize(filteredSessions), [filteredSessions]);

  const dayGroups = useMemo(
    () => groupSessionsByDay(filteredSessions),
    [filteredSessions]
  );

  const pages = useMemo(
    () => paginateDayGroups(dayGroups, SESSIONS_PER_PAGE),
    [dayGroups]
  );

  /** Every day with practice (ignores filters) — feeds the calendar. */
  const allDayGroups = useMemo(
    () => groupSessionsByDay(sessions ?? []),
    [sessions]
  );

  // Reset to the first page whenever the active filters change (render-time
  // state adjustment — the sanctioned alternative to a setState effect).
  const filterKey = `${filters.range}|${filters.date}|${filters.type}|${filters.duration}|${filters.sort}`;
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
    if (!filters.date) return null;
    const map = new Map<string, number>();
    [...filteredSessions]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach((session, i) => map.set(session.id, i + 1));
    return map;
  }, [filters.date, filteredSessions]);

  const handlePageChange = (next: number) => {
    setPage(next);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 pb-24 pt-2 lg:px-8">
      <PracticeLogFilters
        filters={filters}
        setFilters={setFilters}
        isFiltered={isFiltered}
      />

      {isLoading || sessions === null ? (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
          <div className="h-80 animate-pulse rounded-xl bg-white/[0.03]" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-xl bg-white/[0.03]"
              />
            ))}
          </div>
        </div>
      ) : !hasAnySessions ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <NotebookPen size={24} className="text-zinc-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-200">{t("page.empty")}</p>
            <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-zinc-500">
              {t("page.empty_hint")}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
          <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl bg-white/[0.03] p-4 backdrop-blur-sm sm:p-5">
              <PracticeCalendar
                days={allDayGroups}
                selectedDate={filters.date}
                onSelect={(date) => setFilters({ date })}
              />
            </div>
            {hasResults && (
              <div className="rounded-xl bg-white/[0.03] p-4 backdrop-blur-sm sm:p-5">
                <PracticeLogSummary summary={summary} />
              </div>
            )}
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            {!hasResults ? (
              <div className="flex flex-col items-center gap-4 rounded-xl bg-white/[0.03] py-20 text-center">
                <NotebookPen size={24} className="text-zinc-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-200">
                    {t("page.empty_filtered")}
                  </p>
                  <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-zinc-500">
                    {t("page.empty_filtered_hint")}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFilters({
                      range: "all",
                      date: null,
                      type: "all",
                      duration: "all",
                    })
                  }
                  className="text-xs font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
                >
                  {t("filters.clear_all")}
                </button>
              </div>
            ) : (
              <>
                {filters.date ? (
                  <DayTimeline sessions={filteredSessions} />
                ) : (
                  summary.dailyRows.length >= 2 && (
                    <ActivityChart
                      data={summary.dailyRows}
                      showRangeSelect={false}
                      className="bg-white/[0.03] p-4 backdrop-blur-sm sm:p-5"
                    />
                  )
                )}

                <section ref={listRef} className="flex flex-col gap-4">
                  <div className="flex items-baseline justify-between gap-3 px-3">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      {t("page.sessions_heading")} · {filteredSessions.length}
                    </h2>
                    {totalPages > 1 && (
                      <p className="text-[11px] tabular-nums text-zinc-600">
                        {t("pagination.page_of", {
                          page: currentPage,
                          total: totalPages,
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    {visibleGroups.map((group) => (
                      <div
                        key={group.dateKey}
                        className="rounded-xl bg-white/[0.03] p-2 backdrop-blur-sm sm:p-2.5"
                      >
                        <div className="flex items-baseline justify-between gap-3 px-3 pb-1 pt-1.5">
                          <h3 className="font-display text-[15px] font-semibold text-zinc-100">
                            {group.date.toLocaleDateString("en", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              ...(group.date.getFullYear() !== currentYear && {
                                year: "numeric",
                              }),
                            })}
                          </h3>
                          <p className="flex shrink-0 items-center gap-2.5 text-[11px] tabular-nums text-zinc-500">
                            <span>
                              {t("page.day_sessions", {
                                count: group.sessions.length,
                              })}
                            </span>
                            <span>{convertMsToHM(group.totalTimeMs)}h</span>
                            <span className="flex items-center gap-1">
                              <img
                                src="/images/points.png"
                                alt=""
                                aria-hidden
                                className="h-3 w-3 object-contain"
                              />
                              {group.totalPoints}
                            </span>
                          </p>
                        </div>
                        <div className="mt-1 flex flex-col">
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
                      </div>
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
