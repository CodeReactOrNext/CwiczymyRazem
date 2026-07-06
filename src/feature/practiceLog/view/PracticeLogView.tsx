import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { CalendarDays, ListMusic, NotebookPen, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import { convertMsToHM } from "utils/converter";

import { DeleteReportDialog } from "../components/DeleteReportDialog";
import { EditReportModal } from "../components/EditReportModal";
import { PracticeLogFilters } from "../components/PracticeLogFilters";
import { PracticeLogSummary } from "../components/PracticeLogSummary";
import { SessionCard } from "../components/SessionCard";
import { usePracticeLogFilters } from "../hooks/usePracticeLogFilters";
import { usePracticeLogSessions } from "../hooks/usePracticeLogSessions";
import type { PracticeLogSession } from "../types/practiceLog.types";
import {
  applyFilters,
  applySort,
  groupSessionsByDay,
  summarize,
} from "../utils/practiceLog.utils";

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

  const filteredSessions = useMemo(
    () => applySort(applyFilters(sessions ?? [], filters), filters.sort),
    [sessions, filters]
  );

  const summary = useMemo(
    () => summarize(filteredSessions),
    [filteredSessions]
  );

  const dayGroups = useMemo(
    () => groupSessionsByDay(filteredSessions),
    [filteredSessions]
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 pb-24 lg:px-6">
      <PracticeLogFilters
        filters={filters}
        setFilters={setFilters}
        isFiltered={isFiltered}
      />

      {isLoading || sessions === null ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-zinc-900/40"
              />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-zinc-900/40"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl bg-zinc-800/30 py-20 text-center ring-1 ring-white/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900/60 ring-1 ring-white/5">
            <NotebookPen className="text-zinc-500" size={28} />
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-zinc-100">
              {isFiltered ? t("page.empty_filtered") : t("page.empty")}
            </p>
            <p className="mx-auto max-w-xs text-sm text-zinc-400">
              {isFiltered
                ? t("page.empty_filtered_hint")
                : t("page.empty_hint")}
            </p>
          </div>
        </div>
      ) : (
        <>
          <PracticeLogSummary summary={summary} />

          <section className="flex flex-col gap-3">
            <header className="flex items-center gap-2 px-1">
              <ListMusic size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                {t("page.sessions_heading")}
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-zinc-300">
                {filteredSessions.length}
              </span>
            </header>

            <div className="flex flex-col gap-5">
              {dayGroups.map((group) => (
                <div key={group.dateKey} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <CalendarDays size={14} className="text-zinc-500" />
                      <h3 className="text-sm font-bold">
                        {group.date.toLocaleDateString("en", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </h3>
                    </div>
                    <div className="h-px flex-1 bg-white/5" />
                    <div className="flex shrink-0 items-center gap-3 text-[11px] font-semibold text-zinc-500">
                      <span>
                        {t("page.day_sessions", {
                          count: group.sessions.length,
                        })}
                      </span>
                      <span className="font-mono">
                        {convertMsToHM(group.totalTimeMs)}h
                      </span>
                      <span className="flex items-center gap-1 text-amber-400/80">
                        <Star size={10} fill="currentColor" />
                        {group.totalPoints}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.sessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onEdit={setEditingSession}
                        onDelete={setDeletingSession}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
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
